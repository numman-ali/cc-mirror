/**
 * WriteConfigStep - Writes the settings.json configuration file
 */

import path from 'node:path';
import { buildEnv } from '../../../providers/index.js';
import { writeJson } from '../../fs.js';
import { ensureApiKeyApproval } from '../../claude-config.js';
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
    const { params, provider, paths, state } = ctx;

    ctx.report('Writing configuration...');

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

    const authMode = provider.authMode ?? 'apiKey';
    if (authMode === 'apiKey' && !env.ANTHROPIC_API_KEY) {
      env.ANTHROPIC_API_KEY = '<API_KEY>';
    }

    const config: VariantConfig = { env };
    writeJson(path.join(paths.configDir, 'settings.json'), config);

    state.env = env;
    state.resolvedApiKey = typeof env.ANTHROPIC_API_KEY === 'string' ? env.ANTHROPIC_API_KEY : undefined;

    ensureApiKeyApproval(paths.configDir, state.resolvedApiKey);

    // Add notes for auth issues
    if (provider.authMode === 'authToken' && !env.ANTHROPIC_AUTH_TOKEN) {
      state.notes.push('ANTHROPIC_AUTH_TOKEN not set; provider auth may fail.');
    }

    // Providers with requiresModelMapping need model configuration
    if (provider.requiresModelMapping) {
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
