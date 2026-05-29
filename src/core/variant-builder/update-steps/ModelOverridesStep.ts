/**
 * ModelOverridesStep - Applies model override settings
 */

import { ensureSettingsEnvOverrides, ensureSettingsModel } from '../../claude-config.js';
import { getProviderCapability, resolveStartupModelSetting } from '../../../providers/index.js';
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

    const normalizedHaiku = opts.modelOverrides.haiku?.trim();
    const normalizedSmallFast = opts.modelOverrides.smallFast?.trim();
    const profile = getProviderCapability(meta.provider);

    const envOverridesUpdated = ensureSettingsEnvOverrides(meta.configDir, {
      ...(opts.modelOverrides.sonnet ? { ANTHROPIC_DEFAULT_SONNET_MODEL: opts.modelOverrides.sonnet } : {}),
      ...(opts.modelOverrides.opus ? { ANTHROPIC_DEFAULT_OPUS_MODEL: opts.modelOverrides.opus } : {}),
      ...(opts.modelOverrides.haiku ? { ANTHROPIC_DEFAULT_HAIKU_MODEL: opts.modelOverrides.haiku } : {}),
      ...(normalizedSmallFast
        ? { ANTHROPIC_SMALL_FAST_MODEL: normalizedSmallFast }
        : normalizedHaiku
          ? { ANTHROPIC_SMALL_FAST_MODEL: normalizedHaiku }
          : {}),
      ...(opts.modelOverrides.subagentModel ? { CLAUDE_CODE_SUBAGENT_MODEL: opts.modelOverrides.subagentModel } : {}),
    });
    const modelUpdated = profile
      ? ensureSettingsModel(meta.configDir, resolveStartupModelSetting(profile, opts.modelOverrides))
      : false;

    if (envOverridesUpdated || modelUpdated) {
      state.notes.push('Updated model mapping in settings.json.');
    }
  }
}
