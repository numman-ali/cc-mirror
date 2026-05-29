/**
 * E2E Tests - Doctor Command
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import * as core from '../../src/core/index.js';
import { MINIMAX_DENY_TOOLS, ZAI_DENY_TOOLS } from '../../src/core/claude-config.js';
import { getWrapperPath, getWrapperScriptPath, isWindows } from '../../src/core/paths.js';
import { enrichDoctorReport } from '../../src/cli/doctor.js';
import { runDoctorCommand } from '../../src/cli/commands/doctorCmd.js';
import type { ParsedArgs } from '../../src/cli/args.js';
import { makeTempDir, cleanup, resolveNativeClaudePath, writeExecutable } from '../helpers/index.js';

type SettingsFixture = {
  env?: Record<string, string | number | undefined>;
  permissions?: {
    deny?: string[];
  };
};

type ClaudeConfigFixture = {
  mcpServers?: Record<string, unknown>;
};

type VariantMetaFixture = {
  shellEnv?: boolean;
};

const readJson = <T>(filePath: string): T => JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;

const writeJson = (filePath: string, value: unknown): void => {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
};

const captureOutput = (fn: () => void): string[] => {
  const logs: string[] = [];
  const originalLog = console.log;
  console.log = (...args: unknown[]) => logs.push(args.join(' '));
  try {
    fn();
  } finally {
    console.log = originalLog;
  }
  return logs;
};

const createDoctorVariant = (params: {
  rootDir: string;
  binDir: string;
  name: string;
  provider: string;
  apiKey?: string;
}) => {
  const variantDir = path.join(params.rootDir, params.name);
  const configDir = path.join(variantDir, 'config');
  const tweakDir = path.join(variantDir, 'tweakcc');
  const nativeDir = path.join(variantDir, 'native');
  const binaryPath = resolveNativeClaudePath(nativeDir);
  const apiKey = params.apiKey ?? 'test-key';

  fs.mkdirSync(configDir, { recursive: true });
  fs.mkdirSync(tweakDir, { recursive: true });
  fs.mkdirSync(nativeDir, { recursive: true });
  fs.mkdirSync(params.binDir, { recursive: true });
  writeExecutable(binaryPath, '#!/usr/bin/env node\nconsole.log("fake claude");\n');

  const settings: SettingsFixture = {
    env: {
      ANTHROPIC_BASE_URL:
        params.provider === 'zai' ? 'https://api.z.ai/api/anthropic' : 'https://api.minimax.io/anthropic',
      ANTHROPIC_AUTH_TOKEN: apiKey,
      ANTHROPIC_API_KEY: '',
      ...(params.provider === 'zai' ? { Z_AI_API_KEY: apiKey } : {}),
    },
    permissions: {
      deny: params.provider === 'zai' ? [...ZAI_DENY_TOOLS] : [...MINIMAX_DENY_TOOLS],
    },
  };
  writeJson(path.join(configDir, 'settings.json'), settings);

  const claudeConfig: ClaudeConfigFixture =
    params.provider === 'minimax'
      ? {
          mcpServers: {
            MiniMax: {
              command: 'uvx',
              args: ['minimax-coding-plan-mcp', '-y'],
              env: {
                MINIMAX_API_KEY: apiKey,
                MINIMAX_API_HOST: 'https://api.minimax.io',
              },
            },
          },
        }
      : {};
  writeJson(path.join(configDir, '.claude.json'), claudeConfig);

  const wrapperPath = getWrapperPath(params.binDir, params.name);
  if (isWindows) {
    fs.writeFileSync(wrapperPath, '@echo off\r\necho fake claude\r\n');
    fs.writeFileSync(getWrapperScriptPath(params.binDir, params.name), 'console.log("fake claude");\n');
  } else {
    writeExecutable(wrapperPath, '#!/usr/bin/env bash\necho fake claude\n');
  }

  writeJson(path.join(variantDir, 'variant.json'), {
    name: params.name,
    provider: params.provider,
    createdAt: new Date().toISOString(),
    claudeOrig: 'native:0.0.0',
    binaryPath,
    configDir,
    tweakDir,
    brand: params.provider,
    shellEnv: false,
    binDir: params.binDir,
    nativeDir,
  });
};

const getDoctorReport = (rootDir: string, binDir: string, opts: Parameters<typeof enrichDoctorReport>[2] = {}) => {
  return enrichDoctorReport(core.doctor(rootDir, binDir), rootDir, {
    variants: core.listVariants(rootDir),
    ...opts,
  });
};

test('E2E: Doctor command', async (t) => {
  const createdDirs: string[] = [];

  t.after(() => {
    for (const dir of createdDirs) {
      cleanup(dir);
    }
  });

  await t.test('doctor reports healthy variants', async () => {
    const rootDir = makeTempDir();
    const binDir = makeTempDir();
    createdDirs.push(rootDir, binDir);

    // Create multiple variants
    for (const provider of ['zai', 'minimax']) {
      await createDoctorVariant({
        name: `doctor-${provider}`,
        rootDir,
        binDir,
        provider,
      });
    }

    // Run doctor
    const report = core.doctor(rootDir, binDir);

    assert.equal(report.length, 2, 'Doctor should report 2 variants');
    for (const entry of report) {
      assert.ok(entry.ok, `Variant ${entry.name} should be healthy`);
    }
  });

  await t.test('doctor reports provider runtime and capabilities without secrets', async () => {
    const rootDir = makeTempDir();
    const binDir = makeTempDir();
    createdDirs.push(rootDir, binDir);

    await createDoctorVariant({
      name: 'doctor-zai-sanitized',
      provider: 'zai',
      apiKey: 'super-secret-zai-key',
      rootDir,
      binDir,
    });

    const report = getDoctorReport(rootDir, binDir);
    const entry = report.find((item) => item.name === 'doctor-zai-sanitized');
    assert.ok(entry);

    assert.equal(entry.provider, 'zai');
    assert.equal(entry.ok, true);
    assert.equal(entry.runtime?.auth.ok, true);
    assert.equal(entry.capabilities?.permissions.ok, true);
    assert.equal(entry.capabilities?.mcp.ok, true);
    assert.ok(entry.runtime?.auth.presentEnv.includes('ANTHROPIC_AUTH_TOKEN'));
    assert.ok(entry.runtime?.auth.presentEnv.includes('Z_AI_API_KEY'));
    assert.equal(JSON.stringify(entry).includes('super-secret-zai-key'), false);

    const opts: ParsedArgs = { _: [], env: [], root: rootDir, 'bin-dir': binDir, json: true };
    const output = captureOutput(() => runDoctorCommand({ opts }));
    const commandReport = JSON.parse(output.join('\n')) as Array<{ provider?: string; runtime?: unknown }>;
    assert.equal(commandReport[0]?.provider, 'zai');
    assert.ok(commandReport[0]?.runtime);
    assert.equal(output.join('\n').includes('super-secret-zai-key'), false);
  });

  await t.test('doctor reports missing required provider env', async () => {
    const rootDir = makeTempDir();
    const binDir = makeTempDir();
    createdDirs.push(rootDir, binDir);

    await createDoctorVariant({
      name: 'doctor-minimax-missing-env',
      provider: 'minimax',
      rootDir,
      binDir,
    });

    const settingsPath = path.join(rootDir, 'doctor-minimax-missing-env', 'config', 'settings.json');
    const settings = readJson<SettingsFixture>(settingsPath);
    delete settings.env?.ANTHROPIC_AUTH_TOKEN;
    writeJson(settingsPath, settings);

    const report = getDoctorReport(rootDir, binDir);
    const entry = report.find((item) => item.name === 'doctor-minimax-missing-env');
    assert.ok(entry);

    assert.equal(entry.ok, true, 'legacy ok should remain binary/wrapper compatibility');
    assert.equal(entry.runtime?.auth.ok, false);
    assert.ok(entry.runtime?.auth.missingEnv.includes('ANTHROPIC_AUTH_TOKEN'));
    assert.ok(entry.findings?.some((finding) => finding.code === 'missing-required-env'));
    assert.equal(JSON.stringify(entry).includes('test-key'), false);
  });

  await t.test('doctor reports auth token removed by wrapper flag', async () => {
    const rootDir = makeTempDir();
    const binDir = makeTempDir();
    createdDirs.push(rootDir, binDir);

    await createDoctorVariant({
      name: 'doctor-kimi-unset-token',
      provider: 'kimi',
      rootDir,
      binDir,
    });

    const settingsPath = path.join(rootDir, 'doctor-kimi-unset-token', 'config', 'settings.json');
    const settings = readJson<SettingsFixture>(settingsPath);
    settings.env = {
      ...settings.env,
      ANTHROPIC_BASE_URL: 'https://api.moonshot.ai/anthropic',
      CC_MIRROR_UNSET_AUTH_TOKEN: '1',
    };
    writeJson(settingsPath, settings);

    const report = getDoctorReport(rootDir, binDir);
    const entry = report.find((item) => item.name === 'doctor-kimi-unset-token');
    assert.ok(entry);

    assert.equal(entry.runtime?.auth.ok, false);
    assert.ok(entry.findings?.some((finding) => finding.code === 'auth-token-unset-by-wrapper'));
  });

  await t.test('doctor reports provider permission drift', async () => {
    const rootDir = makeTempDir();
    const binDir = makeTempDir();
    createdDirs.push(rootDir, binDir);

    await createDoctorVariant({
      name: 'doctor-minimax-permissions',
      provider: 'minimax',
      rootDir,
      binDir,
    });

    const settingsPath = path.join(rootDir, 'doctor-minimax-permissions', 'config', 'settings.json');
    const settings = readJson<SettingsFixture>(settingsPath);
    settings.permissions = { ...(settings.permissions ?? {}), deny: [] };
    writeJson(settingsPath, settings);

    const report = getDoctorReport(rootDir, binDir);
    const entry = report.find((item) => item.name === 'doctor-minimax-permissions');
    assert.ok(entry);

    assert.equal(entry.ok, true);
    assert.equal(entry.capabilities?.permissions.ok, false);
    assert.ok(entry.capabilities?.permissions.missingDeny.includes('WebSearch'));
    assert.ok(entry.findings?.some((finding) => finding.code === 'missing-permission-deny'));
  });

  await t.test('doctor reports missing provider MCP server', async () => {
    const rootDir = makeTempDir();
    const binDir = makeTempDir();
    createdDirs.push(rootDir, binDir);

    await createDoctorVariant({
      name: 'doctor-minimax-mcp',
      provider: 'minimax',
      rootDir,
      binDir,
    });

    const claudeConfigPath = path.join(rootDir, 'doctor-minimax-mcp', 'config', '.claude.json');
    const claudeConfig = readJson<ClaudeConfigFixture>(claudeConfigPath);
    delete claudeConfig.mcpServers?.MiniMax;
    writeJson(claudeConfigPath, claudeConfig);

    const report = getDoctorReport(rootDir, binDir);
    const entry = report.find((item) => item.name === 'doctor-minimax-mcp');
    assert.ok(entry);

    assert.equal(entry.ok, true);
    assert.equal(entry.capabilities?.mcp.ok, false);
    assert.ok(entry.capabilities?.mcp.missingServers.includes('MiniMax'));
    assert.ok(entry.findings?.some((finding) => finding.code === 'missing-mcp-server'));
  });

  await t.test('doctor reports Z.ai shell profile drift when requested', async () => {
    const rootDir = makeTempDir();
    const binDir = makeTempDir();
    const homeDir = makeTempDir();
    createdDirs.push(rootDir, binDir, homeDir);

    await createDoctorVariant({
      name: 'doctor-zai-profile',
      provider: 'zai',
      rootDir,
      binDir,
    });

    const metaPath = path.join(rootDir, 'doctor-zai-profile', 'variant.json');
    const meta = readJson<VariantMetaFixture>(metaPath);
    meta.shellEnv = true;
    writeJson(metaPath, meta);

    const profilePath = path.join(homeDir, '.zshrc');
    const report = getDoctorReport(rootDir, binDir, {
      env: { ...process.env, HOME: homeDir, SHELL: '/bin/zsh', Z_AI_API_KEY: '' },
      shellProfilePath: profilePath,
    });
    const entry = report.find((item) => item.name === 'doctor-zai-profile');
    assert.ok(entry);

    assert.equal(entry.ok, true);
    assert.equal(entry.runtime?.profile.status, 'missing');
    assert.ok(entry.findings?.some((finding) => finding.code === 'profile-drift'));
  });
});
