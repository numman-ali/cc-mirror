/**
 * ConfigUpdateStep - Updates configuration (API key, MCP, onboarding, env defaults)
 */

import { getBrandThemeId } from '../../../brands/index.js';
import {
  ensureApiKeyApproval,
  ensureMinimaxMcpServer,
  ensureOnboardingState,
  ensureSettingsEnvDefaults,
  ensureZaiMcpDeny,
} from '../../claude-config.js';
import type { UpdateContext, UpdateStep } from '../types.js';

export class ConfigUpdateStep implements UpdateStep {
  name = 'Config';

  execute(ctx: UpdateContext): void {
    ctx.report('Updating configuration...');
    this.updateConfig(ctx, false);
  }

  async executeAsync(ctx: UpdateContext): Promise<void> {
    await ctx.report('Updating configuration...');
    await this.updateConfig(ctx, true);
  }

  private async updateConfig(ctx: UpdateContext, isAsync: boolean): Promise<void> {
    const { opts, meta, state } = ctx;

    ensureApiKeyApproval(meta.configDir);

    // MiniMax MCP server
    if (meta.provider === 'minimax') {
      if (isAsync) {
        await ctx.report('Configuring MiniMax MCP server...');
      } else {
        ctx.report('Configuring MiniMax MCP server...');
      }
      ensureMinimaxMcpServer(meta.configDir);
    }

    // Z.ai MCP deny
    if (meta.provider === 'zai') {
      const denied = ensureZaiMcpDeny(meta.configDir);
      if (denied) {
        state.notes.push('Blocked Z.ai-injected MCP tools in settings.json.');
      }
    }

    // Onboarding and theme
    const brandThemeId = !opts.noTweak && state.brandKey ? getBrandThemeId(state.brandKey) : null;
    const onboarding = ensureOnboardingState(meta.configDir, {
      themeId: brandThemeId ?? 'dark',
      forceTheme: Boolean(brandThemeId),
    });

    // Env defaults
    const envDefaultsUpdated = ensureSettingsEnvDefaults(meta.configDir, {
      TWEAKCC_CONFIG_DIR: meta.tweakDir,
      DISABLE_AUTOUPDATER: '1',
      DISABLE_AUTO_MIGRATE_TO_NATIVE: '1',
      CLAUDE_CODE_ENABLE_PROMPT_SUGGESTION: '1',
    });

    if (envDefaultsUpdated) {
      state.notes.push(
        'Disabled Claude Code auto-updater and auto-migration (DISABLE_AUTOUPDATER=1, DISABLE_AUTO_MIGRATE_TO_NATIVE=1).'
      );
    }
    if (onboarding.themeChanged) {
      state.notes.push(`Default theme set to ${brandThemeId ?? 'dark'}.`);
    }
    if (onboarding.onboardingChanged) {
      state.notes.push('Onboarding marked complete.');
    }
  }
}
