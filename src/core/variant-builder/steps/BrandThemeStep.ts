/**
 * BrandThemeStep - Sets up brand theme and onboarding state
 */

import { getBrandThemeId, resolveBrandKey } from '../../../brands/index.js';
import { ensureManagedMcpServers, ensureOnboardingState, ensureSettingsPermissionsDeny } from '../../claude-config.js';
import { ensureTweakccConfig } from '../../tweakcc.js';
import { getProviderCapability } from '../../../providers/index.js';
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

    const profile = getProviderCapability(ctx.params.providerKey);
    if (profile?.claudeConfig.mcpServers.length) {
      await ctx.report(`Configuring ${profile.key} MCP servers...`);
    }
  }

  private setupBrand(ctx: BuildContext): void {
    const { params, paths, prefs, state } = ctx;
    const profile = getProviderCapability(params.providerKey);
    if (!profile) {
      throw new Error(`Unknown provider capability profile: ${params.providerKey}`);
    }

    const brandKey = resolveBrandKey(params.providerKey, params.brand);
    prefs.brandKey = brandKey;

    ensureTweakccConfig(paths.tweakDir, brandKey, params.providerKey);

    const brandThemeId = !params.noTweak && brandKey ? getBrandThemeId(brandKey) : null;
    const skipOnboardingFlag = profile.claudeConfig.onboarding === 'skip';
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

    if (profile.claudeConfig.mcpServers.length > 0) {
      ctx.report(`Configuring ${profile.key} MCP servers...`);
      const mcpUpdated = ensureManagedMcpServers(
        paths.configDir,
        profile.claudeConfig.mcpServers,
        state.resolvedApiKey
      );
      if (mcpUpdated) {
        state.notes.push(`Configured ${profile.key} MCP servers.`);
      }
    }

    const denied = ensureSettingsPermissionsDeny(paths.configDir, profile.tools.deny);
    if (denied) {
      state.notes.push(`Applied ${profile.key} required tool deny rules.`);
    }

    // Add note if prompt pack is skipped
    if (params.noTweak && prefs.promptPackPreference) {
      state.notes.push('Prompt pack skipped (tweakcc disabled).');
    }
  }
}
