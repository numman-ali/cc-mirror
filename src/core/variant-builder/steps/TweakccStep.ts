/**
 * TweakccStep - Runs tweakcc patches and applies prompt packs
 *
 * On any failure (tweakcc non-zero exit OR post-patch binary smoke-test
 * failure), the step restores the pristine native binary from cache and
 * downgrades the variant in-flight to the equivalent of --no-tweak. This
 * keeps `cc-mirror create` producing a working binary on platforms where
 * upstream tweakcc currently breaks against Bun >= 1.3.13.
 */

import { DEFAULT_CLAUDE_NATIVE_CACHE_DIR } from '../../constants.js';
import { ensureOnboardingState } from '../../claude-config.js';
import { restorePristineBinary } from '../../install.js';
import { applyPromptPack } from '../../prompt-pack.js';
import {
  formatRollbackNote,
  getTweakccFallbackNote,
  runTweakcc,
  runTweakccAsync,
  smokeTestBinary,
  type TweakccPatchFailure,
} from '../../tweakcc.js';
import type { TweakResult } from '../../types.js';
import type { BuildContext, BuildStep } from '../types.js';

type PatchAttempt =
  | { ok: true; result: TweakResult }
  | { ok: false; failure: TweakccPatchFailure; result: TweakResult };

const evaluatePatch = (result: TweakResult, binaryPath: string): PatchAttempt => {
  const combined = `${result.stderr ?? ''}\n${result.stdout ?? ''}`.trim();
  if (result.status !== 0) {
    return {
      ok: false,
      result,
      failure: { kind: 'tweakcc-failed', output: combined, tweakccSpec: result.tweakccSpec },
    };
  }
  const smoke = smokeTestBinary(binaryPath);
  if (!smoke.ok) {
    return {
      ok: false,
      result,
      failure: { kind: 'smoke-failed', smoke, tweakccSpec: result.tweakccSpec },
    };
  }
  return { ok: true, result };
};

const recordFallbackNote = (state: BuildContext['state'], result: TweakResult): void => {
  const note = getTweakccFallbackNote(result);
  if (note && !state.notes.includes(note)) {
    state.notes.push(note);
  }
};

const performRollback = (ctx: BuildContext, failure: TweakccPatchFailure): void => {
  const { params, paths, state } = ctx;

  const restore = restorePristineBinary({
    binaryPath: state.binaryPath,
    cacheDir: DEFAULT_CLAUDE_NATIVE_CACHE_DIR,
    resolvedVersion: state.nativeResolvedVersion ?? '',
    platform: state.nativePlatform ?? '',
  });

  if (!restore.restored) {
    // Nothing safe to fall back to. Surface a clear, actionable error rather
    // than handing the user a corrupted binary or aborting silently.
    const original = formatRollbackNote(failure);
    throw new Error(
      `${original}\nRollback failed: cached pristine binary is missing at ` +
        `${restore.cachePath ?? '<cacheDir>/<version>/<platform>/claude'}. ` +
        `Re-run with --no-tweak, or clear the variant directory and retry.`
    );
  }

  // BrandThemeStep wrote a brand theme id (e.g. 'zai-gold') into .claude.json;
  // the pristine binary has no such id. Reset to 'dark' so Claude Code uses a
  // built-in theme it actually knows about.
  ensureOnboardingState(paths.configDir, {
    themeId: 'dark',
    forceTheme: true,
    skipOnboardingFlag: params.providerKey === 'mirror',
  });

  state.notes.push(formatRollbackNote(failure));
  // Preserve tweakResult for debug surfaces; tweakRolledBack is the truth flag
  // for "was the patch effective?".
  state.tweakRolledBack = true;
};

export class TweakccStep implements BuildStep {
  name = 'Tweakcc';

  execute(ctx: BuildContext): void {
    const { params, paths, prefs, state } = ctx;
    if (params.noTweak) return;

    ctx.report('Running tweakcc patches...');
    const initial = runTweakcc(paths.tweakDir, state.binaryPath, prefs.commandStdio);
    state.tweakResult = initial;
    recordFallbackNote(state, initial);

    const initialAttempt = evaluatePatch(initial, state.binaryPath);
    if (!initialAttempt.ok) {
      ctx.report('tweakcc patch failed; restoring pristine binary...');
      performRollback(ctx, initialAttempt.failure);
      return;
    }

    if (!prefs.promptPackEnabled) return;

    ctx.report('Applying prompt pack...');
    const packResult = applyPromptPack(paths.tweakDir, params.providerKey);
    if (!packResult.changed) return;

    state.notes.push(`Prompt pack applied (${packResult.updated.join(', ')})`);

    ctx.report('Re-applying tweakcc...');
    const reapply = runTweakcc(paths.tweakDir, state.binaryPath, prefs.commandStdio);
    state.tweakResult = reapply;
    recordFallbackNote(state, reapply);

    const reapplyAttempt = evaluatePatch(reapply, state.binaryPath);
    if (!reapplyAttempt.ok) {
      ctx.report('tweakcc re-apply failed; restoring pristine binary...');
      performRollback(ctx, reapplyAttempt.failure);
    }
  }

  async executeAsync(ctx: BuildContext): Promise<void> {
    const { params, paths, prefs, state } = ctx;
    if (params.noTweak) return;

    await ctx.report('Running tweakcc patches...');
    const initial = await runTweakccAsync(paths.tweakDir, state.binaryPath, prefs.commandStdio);
    state.tweakResult = initial;
    recordFallbackNote(state, initial);

    const initialAttempt = evaluatePatch(initial, state.binaryPath);
    if (!initialAttempt.ok) {
      await ctx.report('tweakcc patch failed; restoring pristine binary...');
      performRollback(ctx, initialAttempt.failure);
      return;
    }

    if (!prefs.promptPackEnabled) return;

    await ctx.report('Applying prompt pack...');
    const packResult = applyPromptPack(paths.tweakDir, params.providerKey);
    if (!packResult.changed) return;

    state.notes.push(`Prompt pack applied (${packResult.updated.join(', ')})`);

    await ctx.report('Re-applying tweakcc...');
    const reapply = await runTweakccAsync(paths.tweakDir, state.binaryPath, prefs.commandStdio);
    state.tweakResult = reapply;
    recordFallbackNote(state, reapply);

    const reapplyAttempt = evaluatePatch(reapply, state.binaryPath);
    if (!reapplyAttempt.ok) {
      await ctx.report('tweakcc re-apply failed; restoring pristine binary...');
      performRollback(ctx, reapplyAttempt.failure);
    }
  }
}
