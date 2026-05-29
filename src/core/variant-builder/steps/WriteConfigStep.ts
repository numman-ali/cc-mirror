/**
 * WriteConfigStep - Writes the settings.json configuration file
 */

import path from 'node:path';
import {
  buildEnv,
  buildManagedClaudeSettings,
  getProviderCapability,
  resolveStartupModelSetting,
} from '../../../providers/index.js';
import { writeJson } from '../../fs.js';
import { ensureApiKeyApproval, ensureClaudeConfigUiSuppressions } from '../../claude-config.js';
import type { VariantConfig } from '../../types.js';
import type { BuildContext, BuildStep } from '../types.js';

export class WriteConfigStep implements BuildStep {
  name = 'WriteConfig';

  execute(ctx: BuildContext): void {
    this.writeConfig(ctx);
  }

  async executeAsync(ctx: BuildContext): Promise<void> {
    await ctx.report('Writing configuration...');
    this.writeConfig(ctx);
  }

  private writeConfig(ctx: BuildContext): void {
    const { params, paths, state } = ctx;

    ctx.report('Writing configuration...');

    const profile = getProviderCapability(params.providerKey);
    if (!profile) {
      throw new Error(`Unknown provider capability profile: ${params.providerKey}`);
    }

    const env = buildEnv({
      providerKey: params.providerKey,
      baseUrl: params.baseUrl,
      apiKey: params.apiKey,
      extraEnv: params.extraEnv,
      modelOverrides: params.modelOverrides,
    });

    if (!Object.hasOwn(env, 'TWEAKCC_CONFIG_DIR')) {
      env.TWEAKCC_CONFIG_DIR = paths.tweakDir;
    }

    // Claude Code native installs assume a global installer layout (~/.local/bin/claude).
    // CC-MIRROR intentionally installs per-variant, so we suppress upstream install warnings.
    if (!Object.hasOwn(env, 'DISABLE_INSTALLATION_CHECKS')) {
      env.DISABLE_INSTALLATION_CHECKS = '1';
    }

    const authMode = profile.auth.mode;
    if (authMode === 'apiKey' && !env.ANTHROPIC_API_KEY) {
      env.ANTHROPIC_API_KEY = '<API_KEY>';
    }

    const startupModel = resolveStartupModelSetting(profile, params.modelOverrides);
    const config: VariantConfig = {
      ...buildManagedClaudeSettings(profile, params.modelOverrides),
      env,
      ...(startupModel ? { model: startupModel } : {}),
      ...(profile.tools.deny.length > 0
        ? {
            permissions: {
              deny: profile.tools.deny,
            },
          }
        : {}),
    };
    writeJson(path.join(paths.configDir, 'settings.json'), config);

    state.env = env;
    state.resolvedApiKey =
      authMode === 'authToken' && typeof env.ANTHROPIC_AUTH_TOKEN === 'string'
        ? env.ANTHROPIC_AUTH_TOKEN
        : typeof env.ANTHROPIC_API_KEY === 'string'
          ? env.ANTHROPIC_API_KEY
          : undefined;

    ensureApiKeyApproval(paths.configDir, state.resolvedApiKey);
    ensureClaudeConfigUiSuppressions(paths.configDir);

    // Add notes for auth issues
    if (authMode === 'authToken' && profile.auth.required && !env.ANTHROPIC_AUTH_TOKEN) {
      state.notes.push('ANTHROPIC_AUTH_TOKEN not set; provider auth may fail.');
    }

    // OpenRouter needs model mapping; CCRouter handles routing internally via its own config
    if (params.providerKey === 'openrouter') {
      const missing: string[] = [];
      if (!env.ANTHROPIC_DEFAULT_SONNET_MODEL) missing.push('ANTHROPIC_DEFAULT_SONNET_MODEL');
      if (!env.ANTHROPIC_DEFAULT_OPUS_MODEL) missing.push('ANTHROPIC_DEFAULT_OPUS_MODEL');
      if (!env.ANTHROPIC_DEFAULT_HAIKU_MODEL) missing.push('ANTHROPIC_DEFAULT_HAIKU_MODEL');
      if (missing.length > 0) {
        state.notes.push(`Model mapping incomplete; add ${missing.join(', ')} if needed.`);
      }
      state.notes.push('Feature support varies by provider. WebSearch/Image tools may require special models.');
    }
  }
}
