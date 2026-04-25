/**
 * TweakccUpdateStep - Runs tweakcc patches with prompt pack support
 *
 * Mirrors TweakccStep's smoke-test + rollback semantics. On any patch
 * failure, restore the pristine binary from cache so the update leaves
 * the variant in a working state. See ../steps/TweakccStep.ts for the
 * rationale.
 */

import { resolveBrandKey } from '../../../brands/index.js';
import { ensureOnboardingState } from '../../claude-config.js';
import { DEFAULT_CLAUDE_NATIVE_CACHE_DIR } from '../../constants.js';
import { formatTweakccFailure } from '../../errors.js';
import { ensureDir } from '../../fs.js';
import { restorePristineBinary } from '../../install.js';
import { applyPromptPack } from '../../prompt-pack.js';
import {
  ensureTweakccConfig,
  formatRollbackNote,
  getTweakccFallbackNote,
  runTweakcc,
  runTweakccAsync,
  smokeTestBinary,
  type TweakccPatchFailure,
} from '../../tweakcc.js';
import type { TweakResult } from '../../types.js';
import type { UpdateContext, UpdateStep } from '../types.js';

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

const recordFallbackNote = (state: UpdateContext['state'], result: TweakResult): void => {
  const note = getTweakccFallbackNote(result);
  if (note && !state.notes.includes(note)) {
    state.notes.push(note);
  }
};

const performRollback = (ctx: UpdateContext, failure: TweakccPatchFailure): void => {
  const { meta, state } = ctx;

  // settingsOnly skips InstallNativeUpdateStep, so we can't reliably resolve
  // the cache key (meta.nativeVersion may be 'stable' / 'latest'). Refuse to
  // rollback in that case — the caller asked us not to touch the binary, so
  // we surface the original error instead of leaving a half-restored state.
  if (!state.nativeResolvedVersion || !state.nativePlatform) {
    if (failure.kind === 'smoke-failed') {
      const reason = failure.smoke.timedOut
        ? 'binary hung'
        : failure.smoke.signal
          ? `killed by ${failure.smoke.signal}`
          : `exit ${failure.smoke.status}`;
      throw new Error(
        `tweakcc patch corrupted the binary (${reason}). Cannot rollback in settings-only update; ` +
          `re-run the full update or recreate the variant with --no-tweak.`
      );
    }
    const out = `${failure.kind === 'tweakcc-failed' ? failure.output : ''}`;
    throw new Error(formatTweakccFailure(out));
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

  // Reset .claude.json themeId to a built-in theme id the pristine binary
  // recognizes. Mirrors TweakccStep behavior; see that file for the why.
  ensureOnboardingState(meta.configDir, {
    themeId: 'dark',
    forceTheme: true,
    skipOnboardingFlag: meta.provider === 'mirror',
  });

  state.notes.push(formatRollbackNote(failure));
  // Preserve tweakResult for debug surfaces; tweakRolledBack is the truth flag.
  state.tweakRolledBack = true;
};

export class TweakccUpdateStep implements UpdateStep {
  name = 'Tweakcc';

  execute(ctx: UpdateContext): void {
    if (ctx.opts.noTweak) return;
    ctx.report('Running tweakcc patches...');
    this.runTweakccFlow(ctx, false);
  }

  async executeAsync(ctx: UpdateContext): Promise<void> {
    if (ctx.opts.noTweak) return;
    await ctx.report('Running tweakcc patches...');
    await this.runTweakccFlow(ctx, true);
  }

  private async runTweakccFlow(ctx: UpdateContext, isAsync: boolean): Promise<void> {
    const { opts, meta, prefs, state } = ctx;

    ensureDir(meta.tweakDir);

    if (opts.brand !== undefined) {
      state.brandKey = resolveBrandKey(meta.provider, opts.brand);
      meta.brand = state.brandKey ?? undefined;
    }

    ensureTweakccConfig(meta.tweakDir, state.brandKey);

    const initial = isAsync
      ? await runTweakccAsync(meta.tweakDir, meta.binaryPath, prefs.commandStdio)
      : runTweakcc(meta.tweakDir, meta.binaryPath, prefs.commandStdio);
    state.tweakResult = initial;
    recordFallbackNote(state, initial);

    const initialAttempt = evaluatePatch(initial, meta.binaryPath);
    if (!initialAttempt.ok) {
      if (isAsync) {
        await ctx.report('tweakcc patch failed; restoring pristine binary...');
      } else {
        ctx.report('tweakcc patch failed; restoring pristine binary...');
      }
      performRollback(ctx, initialAttempt.failure);
      return;
    }

    if (!prefs.promptPackEnabled) return;

    if (isAsync) {
      await ctx.report('Applying prompt pack...');
    } else {
      ctx.report('Applying prompt pack...');
    }
    const packResult = applyPromptPack(meta.tweakDir, meta.provider);
    if (!packResult.changed) return;

    state.notes.push(`Prompt pack applied (${packResult.updated.join(', ')})`);

    if (isAsync) {
      await ctx.report('Re-applying tweakcc...');
    } else {
      ctx.report('Re-applying tweakcc...');
    }
    const reapply = isAsync
      ? await runTweakccAsync(meta.tweakDir, meta.binaryPath, prefs.commandStdio)
      : runTweakcc(meta.tweakDir, meta.binaryPath, prefs.commandStdio);
    state.tweakResult = reapply;
    recordFallbackNote(state, reapply);

    const reapplyAttempt = evaluatePatch(reapply, meta.binaryPath);
    if (!reapplyAttempt.ok) {
      if (isAsync) {
        await ctx.report('tweakcc re-apply failed; restoring pristine binary...');
      } else {
        ctx.report('tweakcc re-apply failed; restoring pristine binary...');
      }
      performRollback(ctx, reapplyAttempt.failure);
    }
  }
}
