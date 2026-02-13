/**
 * ModelOverridesStep - Applies model override settings
 */

import { ensureSettingsEnvOverrides } from '../../claude-config.js';
import type { UpdateContext, UpdateStep } from '../types.js';

export class ModelOverridesStep implements UpdateStep {
  name = 'ModelOverrides';

  execute(ctx: UpdateContext): void {
    this.apply(ctx);
  }

  async executeAsync(ctx: UpdateContext): Promise<void> {
    this.apply(ctx);
  }

  private apply(ctx: UpdateContext): void {
    const { opts, meta, state } = ctx;

    if (!opts.modelOverrides || Object.keys(opts.modelOverrides).length === 0) {
      return;
    }

    const normalizedOpus = opts.modelOverrides.opus?.trim();
    const normalizedHaiku = opts.modelOverrides.haiku?.trim();
    const normalizedDefaultModel = opts.modelOverrides.defaultModel?.trim();
    const normalizedSmallFast = opts.modelOverrides.smallFast?.trim();

    const envOverridesUpdated = ensureSettingsEnvOverrides(meta.configDir, {
      ...(opts.modelOverrides.sonnet ? { ANTHROPIC_DEFAULT_SONNET_MODEL: opts.modelOverrides.sonnet } : {}),
      ...(opts.modelOverrides.opus ? { ANTHROPIC_DEFAULT_OPUS_MODEL: opts.modelOverrides.opus } : {}),
      ...(opts.modelOverrides.haiku ? { ANTHROPIC_DEFAULT_HAIKU_MODEL: opts.modelOverrides.haiku } : {}),
      ...(normalizedSmallFast
        ? { ANTHROPIC_SMALL_FAST_MODEL: normalizedSmallFast }
        : normalizedHaiku
          ? { ANTHROPIC_SMALL_FAST_MODEL: normalizedHaiku }
          : {}),
      ...(normalizedDefaultModel
        ? { ANTHROPIC_MODEL: normalizedDefaultModel }
        : normalizedOpus
          ? { ANTHROPIC_MODEL: normalizedOpus }
          : {}),
      ...(opts.modelOverrides.subagentModel ? { CLAUDE_CODE_SUBAGENT_MODEL: opts.modelOverrides.subagentModel } : {}),
    });

    if (envOverridesUpdated) {
      state.notes.push('Updated model mapping in settings.json.');
    }
  }
}
