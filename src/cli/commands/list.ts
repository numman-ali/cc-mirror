/**
 * List command - lists all variants
 */

import * as core from '../../core/index.js';
import { getWrapperPath } from '../../core/paths.js';
import type { ParsedArgs } from '../args.js';

export interface ListCommandOptions {
  opts: ParsedArgs;
}

/**
 * Execute the list command
 */
export function runListCommand({ opts }: ListCommandOptions): void {
  const rootDir = (opts.root as string) || core.DEFAULT_ROOT;
  const binDir = (opts['bin-dir'] as string) || core.DEFAULT_BIN_DIR;
  const json = Boolean(opts.json);
  const full = Boolean(opts.full);
  const variants = core.listVariants(rootDir);
  if (variants.length === 0) {
    if (json) {
      console.log('[]');
    } else {
      console.log(`No variants found in ${rootDir}`);
    }
    return;
  }

  if (json) {
    const payload = variants.map((entry) => {
      const meta = entry.meta;
      const resolvedBin = (meta?.binDir as string) || binDir;
      return {
        name: entry.name,
        provider: meta?.provider ?? null,
        claudeVersion: meta?.nativeVersion ?? null,
        claudeOrig: meta?.claudeOrig ?? null,
        wrapperPath: getWrapperPath(resolvedBin, entry.name),
        binaryPath: meta?.binaryPath ?? null,
        configDir: meta?.configDir ?? null,
        tweakDir: meta?.tweakDir ?? null,
        createdAt: meta?.createdAt ?? null,
        updatedAt: meta?.updatedAt ?? null,
      };
    });
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  if (full) {
    for (const entry of variants) {
      const meta = entry.meta;
      const provider = meta?.provider ?? 'unknown';
      const spec = meta?.nativeVersion ?? '?';
      const orig = meta?.claudeOrig ?? '';
      const resolvedBin = (meta?.binDir as string) || binDir;
      const wrapperPath = getWrapperPath(resolvedBin, entry.name);
      const suffix = orig ? ` (${orig})` : '';
      console.log(`${entry.name}\t${provider}\t${spec}${suffix}\t${wrapperPath}`);
    }
    return;
  }

  for (const entry of variants) {
    console.log(entry.name);
  }
}
