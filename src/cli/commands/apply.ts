/**
 * Apply command - re-applies tweakcc patches without reinstalling Claude Code
 */

import * as core from '../../core/index.js';
import { getWrapperPath } from '../../core/paths.js';
import type { ParsedArgs } from '../args.js';
import { printSummary } from '../utils/index.js';

export interface ApplyCommandOptions {
  opts: ParsedArgs;
}

/**
 * Execute the apply command
 */
export async function runApplyCommand({ opts }: ApplyCommandOptions): Promise<void> {
  const target = opts._ && opts._[0];
  if (!target) {
    console.error('apply requires a variant name');
    process.exit(1);
  }

  const rootDir = (opts.root as string) || core.DEFAULT_ROOT;
  const binDir = (opts['bin-dir'] as string) || core.DEFAULT_BIN_DIR;
  const rawTweakccStdio = opts['tweakcc-stdio'] as string | undefined;
  const tweakccStdio =
    rawTweakccStdio === 'inherit' || opts.verbose ? 'inherit' : rawTweakccStdio === 'pipe' ? 'pipe' : 'pipe';

  const result = await core.updateVariantAsync(rootDir, target, {
    binDir,
    settingsOnly: true,
    noTweak: Boolean(opts.noTweak),
    tweakccStdio,
  });

  const wrapperPath = getWrapperPath(binDir, target);
  printSummary({
    action: 'Applied',
    meta: result.meta,
    wrapperPath,
    notes: result.notes,
  });
}
