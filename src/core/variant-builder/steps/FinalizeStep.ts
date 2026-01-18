/**
 * FinalizeStep - Writes the variant.json metadata file
 */

import path from 'node:path';
import { writeJson } from '../../fs.js';
import { TEAM_MODE_SUPPORTED } from '../../constants.js';
import type { VariantMeta } from '../../types.js';
import type { BuildContext, BuildStep } from '../types.js';

export class FinalizeStep implements BuildStep {
  name = 'Finalize';

  execute(ctx: BuildContext): void {
    ctx.report('Finalizing variant...');
    this.finalize(ctx);
  }

  async executeAsync(ctx: BuildContext): Promise<void> {
    await ctx.report('Finalizing variant...');
    this.finalize(ctx);
  }

  private finalize(ctx: BuildContext): void {
    const { params, paths, prefs, state, provider } = ctx;

    // Check if team mode was enabled (via params OR provider defaults)
    const teamModeEnabled = TEAM_MODE_SUPPORTED
      ? Boolean(params.enableTeamMode) || Boolean(provider.enablesTeamMode)
      : false;

    const meta: VariantMeta = {
      name: params.name,
      provider: params.providerKey,
      baseUrl: params.baseUrl,
      createdAt: new Date().toISOString(),
      claudeOrig: state.claudeBinary,
      binaryPath: state.binaryPath,
      configDir: paths.configDir,
      tweakDir: paths.tweakDir,
      brand: prefs.brandKey ?? undefined,
      promptPack: prefs.promptPackPreference,
      skillInstall: prefs.skillInstallEnabled,
      shellEnv: prefs.shellEnvEnabled,
      binDir: paths.resolvedBin,
      installType: 'npm',
      npmDir: paths.npmDir,
      npmPackage: prefs.resolvedNpmPackage,
      npmVersion: prefs.resolvedNpmVersion,
      teamModeEnabled,
    };

    writeJson(path.join(paths.variantDir, 'variant.json'), meta);

    // Store meta in state for the builder to access
    state.meta = meta;
  }
}
