/**
 * BrandThemeStep - Sets up brand theme and onboarding state
 */

import { getBrandThemeId, resolveBrandKey } from '../../../brands/index.js';
import {
  ensureMinimaxMcpServer,
  ensureOnboardingState,
  ensureSettingsPermissionsDeny,
  MINIMAX_DENY_TOOLS,
  ZAI_DENY_TOOLS,
} from '../../claude-config.js';
import { ensureTweakccConfig } from '../../tweakcc.js';
import type { BuildContext, BuildStep } from '../types.js';

export class BrandThemeStep implements BuildStep {
  name = 'BrandTheme';

  execute(ctx: BuildContext): void {
    ctx.report('Setting up brand theme...');
    this.setupBrand(ctx);
  }

  async executeAsync(ctx: BuildContext): Promise<void> {
    await ctx.report('Setting up brand theme...');
    this.setupBrand(ctx);

    if (ctx.params.providerKey === 'minimax') {
      await ctx.report('Configuring MiniMax MCP server...');
    }
  }

  private setupBrand(ctx: BuildContext): void {
    const { params, paths, prefs, state } = ctx;

    const brandKey = resolveBrandKey(params.providerKey, params.brand);
    prefs.brandKey = brandKey;

    ensureTweakccConfig(paths.tweakDir, brandKey);

    const brandThemeId = !params.noTweak && brandKey ? getBrandThemeId(brandKey) : null;
    // Mirror provider: skip onboarding flag so users see login screen
    const skipOnboardingFlag = params.providerKey === 'mirror';
    const onboarding = ensureOnboardingState(paths.configDir, {
      themeId: brandThemeId ?? 'dark',
      forceTheme: Boolean(brandThemeId),
      skipOnboardingFlag,
    });

    if (onboarding.themeChanged) {
      state.notes.push(`Default theme set to ${brandThemeId ?? 'dark'}.`);
    }
    if (onboarding.onboardingChanged) {
      state.notes.push('Onboarding marked complete.');
    }
    if (skipOnboardingFlag) {
      state.notes.push('Login screen enabled (authenticate when you run the variant).');
    }

    // Provider-specific MCP configuration
    if (params.providerKey === 'minimax') {
      ctx.report('Configuring MiniMax MCP server...');
      ensureMinimaxMcpServer(paths.configDir, state.resolvedApiKey);

      const denied = ensureSettingsPermissionsDeny(paths.configDir, MINIMAX_DENY_TOOLS);
      if (denied) {
        state.notes.push('Blocked WebSearch in settings.json.');
      }
    }

    if (params.providerKey === 'zai') {
      const denied = ensureSettingsPermissionsDeny(paths.configDir, ZAI_DENY_TOOLS);
      if (denied) {
        state.notes.push('Blocked Z.ai injected tools (MCP + WebSearch/WebFetch) in settings.json.');
      }
    }

    // Add note if prompt pack is skipped
    if (params.noTweak && prefs.promptPackPreference) {
      state.notes.push('Prompt pack skipped (tweakcc disabled).');
    }
  }
}
