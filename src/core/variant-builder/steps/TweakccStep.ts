/**
 * TweakccStep - Runs tweakcc patches and applies prompt packs
 */

import { applyPromptPack } from '../../prompt-pack.js';
import { getTweakccResultNotes, runTweakcc, runTweakccAsync } from '../../tweakcc.js';
import { getManagedTweakccPatchIds } from '../../tweakcc-profile.js';
import { formatTweakccFailure } from '../../errors.js';
import type { BuildContext, BuildStep } from '../types.js';

export class TweakccStep implements BuildStep {
  name = 'Tweakcc';

  private addTweakccNotes(ctx: BuildContext): void {
    for (const note of getTweakccResultNotes(ctx.state.tweakResult)) {
      if (!ctx.state.notes.includes(note)) {
        ctx.state.notes.push(note);
      }
    }
  }

  execute(ctx: BuildContext): void {
    const { params, paths, prefs, state } = ctx;
    const patchIds = getManagedTweakccPatchIds(prefs.brandKey, {
      providerKey: params.providerKey,
      promptPackEnabled: prefs.promptPackEnabled,
    });

    if (params.noTweak) {
      return;
    }

    ctx.report('Running tweakcc patches...');
    state.tweakResult = runTweakcc(paths.tweakDir, state.binaryPath, prefs.commandStdio, patchIds);
    this.addTweakccNotes(ctx);

    if (state.tweakResult.status !== 0) {
      const output = `${state.tweakResult.stderr ?? ''}\n${state.tweakResult.stdout ?? ''}`.trim();
      throw new Error(formatTweakccFailure(output));
    }

    let shouldReapply = false;

    if (prefs.promptPackEnabled) {
      ctx.report('Applying prompt pack...');
      const packResult = applyPromptPack(paths.tweakDir, params.providerKey);

      if (packResult.changed) {
        state.notes.push(`Prompt pack applied (${packResult.updated.join(', ')})`);
        shouldReapply = true;
      }
    }

    if (shouldReapply) {
      ctx.report('Re-applying tweakcc...');
      const reapply = runTweakcc(paths.tweakDir, state.binaryPath, prefs.commandStdio, patchIds);
      state.tweakResult = reapply;
      this.addTweakccNotes(ctx);

      if (reapply.status !== 0) {
        const output = `${reapply.stderr ?? ''}\n${reapply.stdout ?? ''}`.trim();
        throw new Error(formatTweakccFailure(output));
      }
    }
  }

  async executeAsync(ctx: BuildContext): Promise<void> {
    const { params, paths, prefs, state } = ctx;
    const patchIds = getManagedTweakccPatchIds(prefs.brandKey, {
      providerKey: params.providerKey,
      promptPackEnabled: prefs.promptPackEnabled,
    });

    if (params.noTweak) {
      return;
    }

    await ctx.report('Running tweakcc patches...');
    state.tweakResult = await runTweakccAsync(paths.tweakDir, state.binaryPath, prefs.commandStdio, patchIds);
    this.addTweakccNotes(ctx);

    if (state.tweakResult.status !== 0) {
      const output = `${state.tweakResult.stderr ?? ''}\n${state.tweakResult.stdout ?? ''}`.trim();
      throw new Error(formatTweakccFailure(output));
    }

    let shouldReapply = false;

    if (prefs.promptPackEnabled) {
      await ctx.report('Applying prompt pack...');
      const packResult = applyPromptPack(paths.tweakDir, params.providerKey);

      if (packResult.changed) {
        state.notes.push(`Prompt pack applied (${packResult.updated.join(', ')})`);
        shouldReapply = true;
      }
    }

    if (shouldReapply) {
      await ctx.report('Re-applying tweakcc...');
      const reapply = await runTweakccAsync(paths.tweakDir, state.binaryPath, prefs.commandStdio, patchIds);
      state.tweakResult = reapply;
      this.addTweakccNotes(ctx);

      if (reapply.status !== 0) {
        const output = `${reapply.stderr ?? ''}\n${reapply.stdout ?? ''}`.trim();
        throw new Error(formatTweakccFailure(output));
      }
    }
  }
}
