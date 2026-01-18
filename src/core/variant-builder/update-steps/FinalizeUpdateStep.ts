/**
 * FinalizeUpdateStep - Writes the updated variant.json metadata
 */

import path from 'node:path';
import { writeJson } from '../../fs.js';
import { TEAM_MODE_SUPPORTED } from '../../constants.js';
import type { UpdateContext, UpdateStep } from '../types.js';

export class FinalizeUpdateStep implements UpdateStep {
  name = 'Finalize';

  execute(ctx: UpdateContext): void {
    ctx.report('Finalizing variant...');
    this.finalize(ctx);
  }

  async executeAsync(ctx: UpdateContext): Promise<void> {
    await ctx.report('Finalizing variant...');
    this.finalize(ctx);
  }

  private finalize(ctx: UpdateContext): void {
    const { meta, paths, prefs } = ctx;

    meta.updatedAt = new Date().toISOString();
    meta.promptPack = prefs.promptPackPreference;
    meta.skillInstall = prefs.skillInstallEnabled;
    meta.shellEnv = prefs.shellEnvEnabled;
    if (!TEAM_MODE_SUPPORTED) {
      meta.teamModeEnabled = false;
    }

    // Remove deprecated promptPackMode if present
    delete meta.promptPackMode;

    writeJson(path.join(paths.variantDir, 'variant.json'), meta);
  }
}
