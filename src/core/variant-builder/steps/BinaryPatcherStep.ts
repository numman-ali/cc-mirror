/**
 * BinaryPatcherStep - Runs the in-repo binary patcher (theme + prompt
 * overlays) and falls back to the Phase 1 rollback flow on failure.
 *
 * Replaces TweakccStep. Same rollback semantics: on patch failure,
 * restore the pristine cached binary, reset .claude.json themeId to
 * 'dark', record a rollback note, set state.tweakRolledBack = true,
 * and continue so the variant remains usable. The patch implementation
 * differs (in-process applyPatches vs out-of-process npx tweakcc) but
 * the contract surfaced to the rest of the build pipeline is identical.
 */

import { ensureOnboardingState } from '../../claude-config.js';
import { DEFAULT_CLAUDE_NATIVE_CACHE_DIR } from '../../constants.js';
import { resolveNativeClaudePath, restorePristineBinary } from '../../install.js';
import { resolveOverlays } from '../../prompt-pack/overlays.js';
import type { OverlayMap, PromptPackKey } from '../../prompt-pack/types.js';
import { applyPatches as defaultApplyPatches, type PatchResult } from '../../binary-patcher/index.js';
import {
  UnpackAndPatchError,
  unpackAndPatch as defaultUnpackAndPatch,
  type UnpackAndPatchResult,
} from '../../binary-patcher/unpack-and-patch.js';
import { formatRollbackNote, smokeTestBinary, type TweakccPatchFailure } from '../../tweakcc.js';
import type { TweakccConfig } from '../../../brands/types.js';
import type { TweakResult } from '../../types.js';
import type { BuildContext, BuildStep } from '../types.js';
import fs from 'node:fs';
import path from 'node:path';

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

const performRollback = (ctx: BuildContext, failure: TweakccPatchFailure): void => {
  const { params, paths, state } = ctx;

  const restore = restorePristineBinary({
    binaryPath: state.binaryPath,
    cacheDir: DEFAULT_CLAUDE_NATIVE_CACHE_DIR,
    resolvedVersion: state.nativeResolvedVersion ?? '',
    platform: state.nativePlatform ?? '',
  });

  if (!restore.restored) {
    const original = formatRollbackNote(failure);
    throw new Error(
      `${original}\nRollback failed: cached pristine binary is missing at ` +
        `${restore.cachePath ?? '<cacheDir>/<version>/<platform>/claude'}. ` +
        `Re-run with --no-tweak, or clear the variant directory and retry.`
    );
  }

  ensureOnboardingState(paths.configDir, {
    themeId: 'dark',
    forceTheme: true,
    skipOnboardingFlag: params.providerKey === 'mirror',
  });

  state.notes.push(formatRollbackNote(failure));
  state.tweakRolledBack = true;
};

const resolveOverlaysFor = (providerKey: string, enabled: boolean): OverlayMap | null => {
  if (!enabled) return null;
  if (!isPromptPackKey(providerKey)) return null;
  return resolveOverlays(providerKey);
};

export interface BinaryPatcherStepDeps {
  applyPatches?: typeof defaultApplyPatches;
  unpackAndPatch?: typeof defaultUnpackAndPatch;
}

export class BinaryPatcherStep implements BuildStep {
  name = 'BinaryPatcher';

  constructor(private deps: BinaryPatcherStepDeps = {}) {}

  execute(ctx: BuildContext): void {
    this.run(ctx, 'sync');
  }

  async executeAsync(ctx: BuildContext): Promise<void> {
    await ctx.report('Patching Claude Code binary...');
    this.run(ctx, 'async');
  }

  private run(ctx: BuildContext, mode: 'sync' | 'async'): void {
    const { params, paths, prefs, state } = ctx;
    if (params.noTweak) return;

    if (mode === 'sync') {
      ctx.report('Patching Claude Code binary...');
    }

    const config = loadConfig(paths.tweakDir);
    if (!config) {
      // No brand config to apply (e.g., variant has no brand selected). Nothing to patch.
      return;
    }

    const overlays = resolveOverlaysFor(params.providerKey, prefs.promptPackEnabled);
    const apply = this.deps.applyPatches ?? defaultApplyPatches;
    const result = apply({ binaryPath: state.binaryPath, config, overlays });

    state.tweakResult = patchResultToTweakResult(result);

    if (!result.ok) {
      if (mode === 'sync') {
        ctx.report('Binary patch failed; restoring pristine binary...');
      }
      performRollback(ctx, patchResultToFailure(result));
      return;
    }

    // Smoke test the patched binary - same contract as Phase 1 had around
    // tweakcc. If `<binary> --version` fails, the patch silently corrupted
    // the binary and we roll back. Skipped patches (writeBuf=null) leave the
    // pristine binary alone, so smoke is unnecessary in that case.
    if (!result.skippedReason) {
      const smoke = smokeTestBinary(state.binaryPath);
      if (!smoke.ok) {
        if (mode === 'sync') {
          ctx.report('Patched binary failed smoke test; restoring pristine binary...');
        }
        performRollback(ctx, { kind: 'smoke-failed', smoke });
        return;
      }
    }

    if (result.skippedReason === 'macho-grow-not-supported') {
      this.runMacosUnpackFallback(ctx, config, overlays);
      return;
    }
    if (result.missingPromptKeys.length > 0) {
      state.notes.push(`Prompt overlay anchor not found for: ${result.missingPromptKeys.join(', ')}`);
    }
    if (result.codesignSkipped) {
      state.notes.push('Binary is unsigned (codesign not available); first launch may show a Gatekeeper prompt.');
    }
  }

  /**
   * macOS-only fallback for the would-grow case. Extracts the embedded JS
   * modules from the SHA256-verified pristine cache copy of the binary,
   * patches them as plain JS, installs the runtime deps that Bun externalizes,
   * and switches the wrapper to invoke `node <entry>` instead of the
   * Bun-compiled binary.
   *
   * On any failure here we fall through to the Phase 1 rollback (pristine
   * binary, native runtime, no theme/overlays) so the variant remains usable.
   */
  private runMacosUnpackFallback(ctx: BuildContext, config: TweakccConfig, overlays: OverlayMap | null): void {
    const { paths, state } = ctx;

    if (!state.nativeResolvedVersion || !state.nativePlatform) {
      state.notes.push(
        'Mach-O patch skipped: theme + prompt patches would grow the binary, and no pristine cache version is recorded for the unpack-and-run-via-node fallback.'
      );
      return;
    }

    const cachePath = resolveNativeClaudePath(
      path.join(DEFAULT_CLAUDE_NATIVE_CACHE_DIR, state.nativeResolvedVersion, state.nativePlatform)
    );
    if (!fs.existsSync(cachePath)) {
      state.notes.push(
        `Mach-O patch skipped: theme + prompt patches would grow the binary, and the pristine cache copy is missing at ${cachePath} (cannot fall back to the unpack-and-run-via-node path).`
      );
      return;
    }

    ctx.report('Mach-O patch would grow binary; unpacking and patching JS for the node runtime...');

    const unpack = this.deps.unpackAndPatch ?? defaultUnpackAndPatch;
    let unpackResult: UnpackAndPatchResult;
    try {
      unpackResult = unpack({
        pristineBinaryPath: cachePath,
        unpackedDir: paths.unpackedDir,
        config,
        overlays,
      });
    } catch (err) {
      const detail = err instanceof UnpackAndPatchError ? err.message : (err as Error).message;
      ctx.report('Unpack-and-patch failed; restoring pristine binary...');
      performRollback(ctx, { kind: 'tweakcc-failed', output: detail });
      return;
    }

    state.wrapperRuntime = 'node';
    state.nodeEntryPath = unpackResult.entryPath;
    state.notes.push(
      'macOS variant: running unpacked JS via node (Mach-O segment shifting not implemented). Brand theme + prompt overlays applied to the extracted cli.js.'
    );
    if (unpackResult.patch.promptMissing.length > 0) {
      state.notes.push(`Prompt overlay anchor not found for: ${unpackResult.patch.promptMissing.join(', ')}`);
    }
  }
}
