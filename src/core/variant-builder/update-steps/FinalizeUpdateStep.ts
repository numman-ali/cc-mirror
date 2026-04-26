/**
 * FinalizeUpdateStep - Writes the updated variant.json metadata
 */

import path from 'node:path';
import { writeJson } from '../../fs.js';
import type { VariantMeta } from '../../types.js';
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
    const { meta, paths, prefs, state } = ctx;

    meta.updatedAt = new Date().toISOString();
    meta.promptPack = prefs.promptPackPreference;
    meta.skillInstall = prefs.skillInstallEnabled;
    meta.shellEnv = prefs.shellEnvEnabled;

    // Remove deprecated promptPackMode if present
    delete meta.promptPackMode;

    // The wrapper-runtime fields persist whatever this update resolved. If the
    // update didn't run the binary patcher (settingsOnly), keep the existing
    // values from variant.json so the wrapper stays on the same runtime.
    const resolvedRuntime = state.wrapperRuntime ?? meta.wrapperRuntime;
    const resolvedNodeEntry = state.nodeEntryPath ?? meta.nodeEntryPath;
    const resolvedUnpackedDir = state.wrapperRuntime === 'node' ? paths.unpackedDir : (meta.unpackedDir ?? undefined);

    // Existing variants may carry legacy metadata fields from older cc-mirror versions.
    // Write a normalized variant.json so the file reflects our current native-only schema.
    const sanitized: VariantMeta = {
      name: meta.name,
      provider: meta.provider,
      baseUrl: meta.baseUrl,
      createdAt: meta.createdAt,
      updatedAt: meta.updatedAt,
      claudeOrig: meta.claudeOrig,
      binaryPath: meta.binaryPath,
      configDir: meta.configDir,
      tweakDir: meta.tweakDir,
      brand: meta.brand,
      promptPack: meta.promptPack,
      skillInstall: meta.skillInstall,
      shellEnv: meta.shellEnv,
      binDir: meta.binDir,
      nativeDir: meta.nativeDir,
      nativeVersion: meta.nativeVersion,
      nativeVersionSource: meta.nativeVersionSource,
      nativePlatform: meta.nativePlatform,
      // Reflect this update's outcome. Drop the flag on successful re-tweak;
      // set it when the update rolled back.
      tweakRolledBack: state.tweakRolledBack ? true : undefined,
      wrapperRuntime: resolvedRuntime,
      nodeEntryPath: resolvedNodeEntry,
      unpackedDir: resolvedUnpackedDir,
    };

    ctx.meta = sanitized;
    writeJson(path.join(paths.variantDir, 'variant.json'), sanitized);
  }
}
