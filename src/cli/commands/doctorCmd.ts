/**
 * Doctor command - checks health of all variants
 */

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import * as core from '../../core/index.js';
import { isWindows } from '../../core/paths.js';
import { collectDoctorSecretValues, enrichDoctorReport, printDoctor, sanitizeDoctorText } from '../doctor.js';
import type { ParsedArgs } from '../args.js';

export interface DoctorCommandOptions {
  opts: ParsedArgs;
}

type LiveDoctorResult = {
  name: string;
  ok: boolean;
  binaryPath?: string;
  wrapperPath: string;
  liveOk?: boolean;
  liveSkipped?: boolean;
  liveSkipReason?: string;
  liveExitCode?: number | null;
  liveTimedOut?: boolean;
  liveDurationMs?: number;
  liveStdout?: string;
  liveStderr?: string;
  liveErrorSummary?: string;
};

const readLiveErrorSummary = (debugFile: string, secrets: string[]): string | undefined => {
  if (!fs.existsSync(debugFile)) return undefined;
  const debugText = sanitizeDoctorText(fs.readFileSync(debugFile, 'utf8'), secrets);
  const usefulLines = debugText
    .split(/\r?\n/)
    .filter((line) => /\[(ERROR|WARN)\]|API error|Invalid Authentication|invalid_authentication/i.test(line))
    .map((line) => line.trim())
    .filter(Boolean);
  return usefulLines.slice(-4).join('\n') || undefined;
};

/**
 * Execute the doctor command
 */
export function runDoctorCommand({ opts }: DoctorCommandOptions): void {
  const rootDir = (opts.root as string) || core.DEFAULT_ROOT;
  const binDir = (opts['bin-dir'] as string) || core.DEFAULT_BIN_DIR;
  const json = Boolean(opts.json);
  const live = Boolean(opts.live);
  const target = opts._ && opts._[0];

  const report = core.doctor(rootDir, binDir);
  const filtered = target ? report.filter((item) => item.name === target) : report;
  const variants = core.listVariants(rootDir);
  const enriched = enrichDoctorReport(filtered, rootDir, { variants });

  if (!live) {
    if (json) {
      console.log(JSON.stringify(enriched, null, 2));
    } else {
      printDoctor(enriched);
    }
    return;
  }

  // Enrich with provider info so we can skip interactive-only variants by default.
  const providerByName = new Map<string, string>();
  for (const entry of variants) {
    if (entry.meta?.provider) providerByName.set(entry.name, entry.meta.provider);
  }

  const includeMirror = Boolean(opts['include-mirror']);
  const prompt = typeof opts.prompt === 'string' ? opts.prompt : 'Reply with exactly: pong';
  const rawTimeout = opts['timeout-ms'];
  const parsedTimeout = typeof rawTimeout === 'string' && rawTimeout.trim().length > 0 ? Number(rawTimeout) : NaN;
  const timeoutMs = Number.isFinite(parsedTimeout) && parsedTimeout > 0 ? parsedTimeout : 20_000;

  const runProbe = (wrapperPath: string, name: string) => {
    const env = { ...process.env, CC_MIRROR_SPLASH: '0' };
    const debugFile = path.join(os.tmpdir(), `cc-mirror-doctor-${process.pid}-${name}-${Date.now()}.log`);
    const args = ['--debug-file', debugFile, '-p', prompt];
    if (isWindows) {
      return {
        child: spawnSync('cmd.exe', ['/c', wrapperPath, ...args], { env, encoding: 'utf8', timeout: timeoutMs }),
        debugFile,
      };
    }
    return { child: spawnSync(wrapperPath, args, { env, encoding: 'utf8', timeout: timeoutMs }), debugFile };
  };

  const results: LiveDoctorResult[] = enriched.map((item) => {
    const provider = providerByName.get(item.name);
    const base: LiveDoctorResult = { ...item };

    if (provider === 'mirror' && !includeMirror) {
      return {
        ...base,
        liveSkipped: true,
        liveSkipReason: 'mirror requires interactive auth (use --include-mirror)',
      };
    }

    if (!item.ok) {
      return { ...base, liveOk: false, liveSkipReason: 'offline checks failed' };
    }

    const started = Date.now();
    const { child, debugFile } = runProbe(item.wrapperPath, item.name);
    const duration = Date.now() - started;
    const timedOut = Boolean((child.error as NodeJS.ErrnoException | undefined)?.code === 'ETIMEDOUT');
    const liveOk = child.status === 0 && !timedOut;
    const secrets = collectDoctorSecretValues(rootDir, item.name);
    const liveErrorSummary = liveOk ? undefined : readLiveErrorSummary(debugFile, secrets);
    if (fs.existsSync(debugFile)) fs.rmSync(debugFile, { force: true });

    return {
      ...base,
      liveOk,
      liveExitCode: child.status,
      liveTimedOut: timedOut,
      liveDurationMs: duration,
      liveStdout: sanitizeDoctorText((child.stdout ?? '').toString().trim(), secrets) || undefined,
      liveStderr: sanitizeDoctorText((child.stderr ?? '').toString().trim(), secrets) || undefined,
      liveErrorSummary,
    };
  });

  if (json) {
    console.log(JSON.stringify(results, null, 2));
    return;
  }

  // Human-friendly live output (avoid dumping full stdout unless needed).
  for (const item of results) {
    if (item.liveSkipped) {
      console.log(`﹣ ${item.name} (skipped: ${item.liveSkipReason})`);
      continue;
    }
    if (item.liveOk) {
      console.log(`✓ ${item.name} (live)`);
      continue;
    }
    console.log(`✗ ${item.name} (live)`);
    if (item.liveTimedOut) {
      console.log(`  reason: timed out after ${timeoutMs}ms`);
    } else if (item.liveExitCode !== undefined) {
      console.log(`  exit: ${item.liveExitCode}`);
    }
    if (item.liveStderr) {
      console.log(`  stderr: ${item.liveStderr.split(/\r?\n/)[0]}`);
    } else if (item.liveErrorSummary) {
      console.log(`  error: ${item.liveErrorSummary.split(/\r?\n/)[0]}`);
    }
  }
}
