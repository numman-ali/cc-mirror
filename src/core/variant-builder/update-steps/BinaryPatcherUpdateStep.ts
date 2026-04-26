/**
 * BinaryPatcherUpdateStep - Update-flow counterpart to BinaryPatcherStep.
 *
 * Mirrors the create-side step's contract: invoke the in-repo patcher,
 * fall back to Phase 1 rollback on failure. Keeps the settingsOnly
 * guard from TweakccUpdateStep that refuses rollback when the caller
 * deliberately skipped the binary reinstall (no nativeResolvedVersion /
 * nativePlatform = no cache key to restore from).
 */

import { resolveBrandKey } from '../../../brands/index.js';
import { ensureOnboardingState } from '../../claude-config.js';
import { DEFAULT_CLAUDE_NATIVE_CACHE_DIR } from '../../constants.js';
import { ensureDir } from '../../fs.js';
import { restorePristineBinary } from '../../install.js';
import { resolveOverlays } from '../../prompt-pack/overlays.js';
import type { OverlayMap, PromptPackKey } from '../../prompt-pack/types.js';
import { applyPatches as defaultApplyPatches, type PatchResult } from '../../binary-patcher/index.js';
import { ensureTweakccConfig, formatRollbackNote, smokeTestBinary, type TweakccPatchFailure } from '../../tweakcc.js';
import type { TweakccConfig } from '../../../brands/types.js';
import type { TweakResult } from '../../types.js';
import type { UpdateContext, UpdateStep } from '../types.js';
import fs from 'node:fs';

const isPromptPackKey = (value: string): value is PromptPackKey => value === 'zai' || value === 'minimax';

const loadConfig = (tweakDir: string): TweakccConfig | null => {
  const configPath = `${tweakDir}/config.json`;
  if (!fs.existsSync(configPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(configPath, 'utf8')) as TweakccConfig;
  } catch {
    return null;
  }
};

const patchResultToTweakResult = (result: PatchResult): TweakResult => {
  if (result.ok) {
    return { status: 0, stderr: '', stdout: '' };
  }
  return { status: 1, stderr: `${result.reason}: ${result.detail}`, stdout: '' };
};

const patchResultToFailure = (result: PatchResult & { ok: false }): TweakccPatchFailure => ({
  kind: 'tweakcc-failed',
  output: `${result.reason}: ${result.detail}`,
});

const performRollback = (ctx: UpdateContext, failure: TweakccPatchFailure): void => {
  const { meta, state } = ctx;

  if (!state.nativeResolvedVersion || !state.nativePlatform) {
    // settingsOnly skipped the binary reinstall; we have no cache key to
    // restore from. Surface the original error rather than leaving a
    // half-restored state.
    throw new Error(
      `${formatRollbackNote(failure)}\nCannot rollback in settings-only update; re-run the full update or recreate the variant with --no-tweak.`
    );
  }

  const restore = restorePristineBinary({
    binaryPath: meta.binaryPath,
    cacheDir: DEFAULT_CLAUDE_NATIVE_CACHE_DIR,
    resolvedVersion: state.nativeResolvedVersion,
    platform: state.nativePlatform,
  });

  if (!restore.restored) {
    const original = formatRollbackNote(failure);
    throw new Error(
      `${original}\nRollback failed: cached pristine binary is missing at ` +
        `${restore.cachePath ?? '<cacheDir>/<version>/<platform>/claude'}. ` +
        `Re-run with --no-tweak, or recreate the variant.`
    );
  }

  ensureOnboardingState(meta.configDir, {
    themeId: 'dark',
    forceTheme: true,
    skipOnboardingFlag: meta.provider === 'mirror',
  });

  state.notes.push(formatRollbackNote(failure));
  state.tweakRolledBack = true;
};

const resolveOverlaysFor = (providerKey: string, enabled: boolean): OverlayMap | null => {
  if (!enabled) return null;
  if (!isPromptPackKey(providerKey)) return null;
  return resolveOverlays(providerKey);
};

export interface BinaryPatcherUpdateStepDeps {
  applyPatches?: typeof defaultApplyPatches;
}

export class BinaryPatcherUpdateStep implements UpdateStep {
  name = 'BinaryPatcher';

  constructor(private deps: BinaryPatcherUpdateStepDeps = {}) {}

  execute(ctx: UpdateContext): void {
    this.run(ctx, 'sync');
  }

  async executeAsync(ctx: UpdateContext): Promise<void> {
    await ctx.report('Patching Claude Code binary...');
    this.run(ctx, 'async');
  }

  private run(ctx: UpdateContext, mode: 'sync' | 'async'): void {
    const { opts, meta, prefs, state } = ctx;
    if (opts.noTweak) return;

    if (mode === 'sync') {
      ctx.report('Patching Claude Code binary...');
    }

    ensureDir(meta.tweakDir);

    if (opts.brand !== undefined) {
      state.brandKey = resolveBrandKey(meta.provider, opts.brand);
      meta.brand = state.brandKey ?? undefined;
    }

    ensureTweakccConfig(meta.tweakDir, state.brandKey);

    const config = loadConfig(meta.tweakDir);
    if (!config) return;

    const overlays = resolveOverlaysFor(meta.provider, prefs.promptPackEnabled);
    const apply = this.deps.applyPatches ?? defaultApplyPatches;
    const result = apply({ binaryPath: meta.binaryPath, config, overlays });

    state.tweakResult = patchResultToTweakResult(result);

    if (!result.ok) {
      if (mode === 'sync') {
        ctx.report('Binary patch failed; restoring pristine binary...');
      }
      performRollback(ctx, patchResultToFailure(result));
      return;
    }

    if (result.skippedReason === 'macho-grow-not-supported') {
      state.notes.push(
        'Mach-O patch skipped: theme + prompt patches would grow the binary. Brand theme + prompt overlays disabled on macOS until segment shifting is implemented.'
      );
      return;
    }

    const smoke = smokeTestBinary(meta.binaryPath);
    if (!smoke.ok) {
      if (mode === 'sync') {
        ctx.report('Patched binary failed smoke test; restoring pristine binary...');
      }
      performRollback(ctx, { kind: 'smoke-failed', smoke });
      return;
    }

    if (result.missingPromptKeys.length > 0) {
      state.notes.push(`Prompt overlay anchor not found for: ${result.missingPromptKeys.join(', ')}`);
    }
    if (result.codesignSkipped) {
      state.notes.push('Binary is unsigned (codesign not available); first launch may show a Gatekeeper prompt.');
    }
  }
}
