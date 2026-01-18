/**
 * TweakccUpdateStep - Runs tweakcc patches with prompt pack support
 */

import { resolveBrandKey } from '../../../brands/index.js';
import { ensureDir } from '../../fs.js';
import { applyPromptPack } from '../../prompt-pack.js';
import { ensureTweakccConfig, runTweakcc, runTweakccAsync } from '../../tweakcc.js';
import { formatTweakccFailure } from '../../errors.js';
import type { UpdateContext, UpdateStep } from '../types.js';

export class TweakccUpdateStep implements UpdateStep {
  name = 'Tweakcc';

  execute(ctx: UpdateContext): void {
    if (ctx.opts.noTweak) return;
    ctx.report('Running tweakcc patches...');
    this.runTweakcc(ctx, false);
  }

  async executeAsync(ctx: UpdateContext): Promise<void> {
    if (ctx.opts.noTweak) return;
    await ctx.report('Running tweakcc patches...');
    await this.runTweakcc(ctx, true);
  }

  private async runTweakcc(ctx: UpdateContext, isAsync: boolean): Promise<void> {
    const { opts, meta, prefs, state } = ctx;

    ensureDir(meta.tweakDir);

    // Handle brand override
    if (opts.brand !== undefined) {
      state.brandKey = resolveBrandKey(meta.provider, opts.brand);
      meta.brand = state.brandKey ?? undefined;
    }

    ensureTweakccConfig(meta.tweakDir, state.brandKey);

    // Run tweakcc
    const tweakResult = isAsync
      ? await runTweakccAsync(meta.tweakDir, meta.binaryPath, prefs.commandStdio)
      : runTweakcc(meta.tweakDir, meta.binaryPath, prefs.commandStdio);

    state.tweakResult = tweakResult;

    if (tweakResult.status !== 0) {
      const output = `${tweakResult.stderr ?? ''}\n${tweakResult.stdout ?? ''}`.trim();
      throw new Error(formatTweakccFailure(output));
    }

    let shouldReapply = false;

    // Apply prompt pack if enabled
    if (prefs.promptPackEnabled) {
      if (isAsync) {
        await ctx.report('Applying prompt pack...');
      } else {
        ctx.report('Applying prompt pack...');
      }

      const packResult = applyPromptPack(meta.tweakDir, meta.provider);
      if (packResult.changed) {
        state.notes.push(`Prompt pack applied (${packResult.updated.join(', ')})`);
        shouldReapply = true;
      }
    }

    if (shouldReapply) {
      if (isAsync) {
        await ctx.report('Re-applying tweakcc...');
      } else {
        ctx.report('Re-applying tweakcc...');
      }

      const reapply = isAsync
        ? await runTweakccAsync(meta.tweakDir, meta.binaryPath, prefs.commandStdio)
        : runTweakcc(meta.tweakDir, meta.binaryPath, prefs.commandStdio);

      state.tweakResult = reapply;

      if (reapply.status !== 0) {
        const output = `${reapply.stderr ?? ''}\n${reapply.stdout ?? ''}`.trim();
        throw new Error(formatTweakccFailure(output));
      }
    }
  }
}
