/**
 * Update command - updates one or all variants
 */

import * as core from '../../core/index.js';
import { getWrapperPath } from '../../core/paths.js';
import type { ParsedArgs } from '../args.js';
import { printSummary } from '../utils/index.js';

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
  const skillInstall = opts['no-skill-install'] ? false : undefined;
  const skillUpdate = Boolean(opts['skill-update']);
  const shellEnv = opts['no-shell-env'] ? false : opts['shell-env'] ? true : undefined;
  const enableTeamMode = opts['enable-team-mode'] ? true : undefined;
  const disableTeamMode = opts['disable-team-mode'] ? true : undefined;
  const rawTweakccStdio = opts['tweakcc-stdio'] as string | undefined;
  const tweakccStdio =
    rawTweakccStdio === 'inherit' || opts.verbose ? 'inherit' : rawTweakccStdio === 'pipe' ? 'pipe' : 'pipe';

  if (!core.TEAM_MODE_SUPPORTED && (enableTeamMode || disableTeamMode)) {
    console.log('Team mode flags are ignored in this release. Use cc-mirror 1.6.3 for team mode support.');
  }

  for (const name of names) {
    const result = core.updateVariant(rootDir, name, {
      binDir,
      npmPackage: opts['npm-package'] as string | undefined,
      brand: opts.brand as string | undefined,
      noTweak: Boolean(opts.noTweak),
      promptPack,
      skillInstall,
      shellEnv,
      skillUpdate,
      enableTeamMode,
      disableTeamMode,
      tweakccStdio,
    });
    const wrapperPath = getWrapperPath(binDir, name);
    printSummary({
      action: 'Updated',
      meta: result.meta,
      wrapperPath,
      notes: result.notes,
    });
  }
}
