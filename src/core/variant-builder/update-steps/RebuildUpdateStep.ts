/**
 * RebuildUpdateStep - Resets variant install dirs for a clean update
 *
 * Keeps config (settings, approvals, tasks, skills) but rebuilds npm/tweakcc + wrapper.
 */

import fs from 'node:fs';
import path from 'node:path';
import { ensureDir } from '../../fs.js';
import { expandTilde, getWrapperPath, getWrapperScriptPath, isWindows } from '../../paths.js';
import type { UpdateContext, UpdateStep } from '../types.js';

export class RebuildUpdateStep implements UpdateStep {
  name = 'Rebuild';

  execute(ctx: UpdateContext): void {
    ctx.report('Resetting variant install directories...');
    this.rebuild(ctx);
  }

  async executeAsync(ctx: UpdateContext): Promise<void> {
    await ctx.report('Resetting variant install directories...');
    this.rebuild(ctx);
  }

  private rebuild(ctx: UpdateContext): void {
    const { opts, meta, paths, state } = ctx;

    if (opts.settingsOnly) {
      return;
    }

    const shouldResetTweakcc = !opts.noTweak;

    if (shouldResetTweakcc) {
      const tweakConfigPath = path.join(meta.tweakDir, 'config.json');
      if (fs.existsSync(tweakConfigPath)) {
        state.savedTweakccConfig = fs.readFileSync(tweakConfigPath, 'utf8');
      }
    }

    if (fs.existsSync(paths.npmDir)) {
      fs.rmSync(paths.npmDir, { recursive: true, force: true });
    }

    if (shouldResetTweakcc && fs.existsSync(meta.tweakDir)) {
      fs.rmSync(meta.tweakDir, { recursive: true, force: true });
    }

    const resolvedBin = opts.binDir ? (expandTilde(opts.binDir) ?? opts.binDir) : meta.binDir;
    if (resolvedBin) {
      const wrapperPath = getWrapperPath(resolvedBin, ctx.name);
      fs.rmSync(wrapperPath, { force: true });
      if (isWindows) {
        const scriptPath = getWrapperScriptPath(resolvedBin, ctx.name);
        fs.rmSync(scriptPath, { force: true });
      }
    }

    if (shouldResetTweakcc && state.savedTweakccConfig) {
      ensureDir(meta.tweakDir);
      fs.writeFileSync(path.join(meta.tweakDir, 'config.json'), state.savedTweakccConfig);
      state.notes.push('Preserved tweakcc config');
    }
  }
}
