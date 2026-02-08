/**
 * FinalizeStep - Writes the variant.json metadata file
 */

import path from 'node:path';
import { writeJson } from '../../fs.js';
import { DEFAULT_CLAUDE_VERSION } from '../../constants.js';
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
    const { params, paths, prefs, state } = ctx;

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
    };

    meta.nativeDir = paths.nativeDir;
    meta.nativeVersion = prefs.resolvedClaudeVersion;
    meta.nativeVersionSource = meta.nativeVersion === DEFAULT_CLAUDE_VERSION ? 'default' : 'pinned';
    meta.nativePlatform = state.nativePlatform;

    writeJson(path.join(paths.variantDir, 'variant.json'), meta);

    // Store meta in state for the builder to access
    state.meta = meta;
  }
}
