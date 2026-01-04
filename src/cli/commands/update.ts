/**
 * Update command - updates one or all variants
 */

import path from 'node:path';
import * as core from '../../core/index.js';
import type { ParsedArgs } from '../args.js';
import { printSummary, parsePromptPackMode } from '../utils/index.js';

export interface UpdateCommandOptions {
  opts: ParsedArgs;
}

/**
 * Execute the update command
 */
export function runUpdateCommand({ opts }: UpdateCommandOptions): void {
  const target = opts._ && opts._[0];
  const rootDir = (opts.root as string) || core.DEFAULT_ROOT;
  const binDir = (opts['bin-dir'] as string) || core.DEFAULT_BIN_DIR;
  const names = target ? [target] : core.listVariants(rootDir).map((entry) => entry.name);

  if (names.length === 0) {
    console.log(`No variants found in ${rootDir}`);
    return;
  }

  const promptPack = opts['no-prompt-pack'] ? false : undefined;
  const promptPackMode = parsePromptPackMode(opts['prompt-pack-mode'] as string | undefined);
  const skillInstall = opts['no-skill-install'] ? false : undefined;
  const skillUpdate = Boolean(opts['skill-update']);
  const shellEnv = opts['no-shell-env'] ? false : opts['shell-env'] ? true : undefined;

  for (const name of names) {
    const result = core.updateVariant(rootDir, name, {
      binDir,
      npmPackage: opts['npm-package'] as string | undefined,
      brand: opts.brand as string | undefined,
      noTweak: Boolean(opts.noTweak),
      promptPack,
      promptPackMode,
      skillInstall,
      shellEnv,
      skillUpdate,
      enableTeamMode: Boolean(opts['enable-team-mode']),
    });
    const wrapperPath = path.join(binDir, name);
    printSummary({
      action: 'Updated',
      meta: result.meta,
      wrapperPath,
      notes: result.notes,
    });
  }
}
