/**
 * ConfigUpdateStep - Updates configuration (API key, MCP, onboarding, env defaults)
 */

import { getBrandThemeId } from '../../../brands/index.js';
import {
  ensureAuthTokenCredentialSettings,
  ensureApiKeyApproval,
  ensureClaudeConfigUiSuppressions,
  ensureManagedMcpServers,
  ensureOnboardingState,
  ensureSettingsEnvOverrides,
  ensureSettingsModel,
  ensureSettingsModelMigration,
  ensureSettingsPermissionsDeny,
  syncSettingsManagedEnv,
  syncSettingsManagedDefaults,
} from '../../claude-config.js';
import {
  buildManagedClaudeSettings,
  buildEnv,
  getManagedSettingsEnvKeys,
  getProvider,
  getProviderCapability,
  resolveModelAliases,
  resolveStartupModelSetting,
  type ProviderCapabilityProfile,
} from '../../../providers/index.js';
import type { UpdateContext, UpdateStep } from '../types.js';

const normalizeUrl = (value?: string) => (value ?? '').trim();

const resolveManagedBaseUrl = (profile: ProviderCapabilityProfile, current?: string): string | undefined => {
  if (!profile.endpoint.managed) return normalizeUrl(current) || undefined;
  const trimmed = normalizeUrl(current);
  const defaultBaseUrl = profile.endpoint.defaultBaseUrl;
  if (!trimmed) return defaultBaseUrl;
  const staleBaseUrls = new Set([defaultBaseUrl, ...(profile.endpoint.staleBaseUrls ?? [])].filter(Boolean));
  return staleBaseUrls.has(trimmed) ? defaultBaseUrl : trimmed;
};

const getCredentialKeys = (profile: ProviderCapabilityProfile): string[] => {
  const keys = [
    profile.auth.credentialEnv,
    ...(profile.auth.derivedCredentialEnv ?? []),
    profile.auth.authTokenAlsoSetsApiKey ? 'ANTHROPIC_API_KEY' : undefined,
  ].filter(Boolean) as string[];
  return profile.auth.emptyApiKey ? keys.filter((key) => key !== 'ANTHROPIC_API_KEY') : keys;
};

const USER_OWNED_MODEL_KEYS = new Set([
  'ANTHROPIC_DEFAULT_OPUS_MODEL',
  'ANTHROPIC_DEFAULT_SONNET_MODEL',
  'ANTHROPIC_DEFAULT_HAIKU_MODEL',
  'ANTHROPIC_DEFAULT_OPUS_MODEL_NAME',
  'ANTHROPIC_DEFAULT_SONNET_MODEL_NAME',
  'ANTHROPIC_DEFAULT_HAIKU_MODEL_NAME',
  'ANTHROPIC_DEFAULT_OPUS_MODEL_DESCRIPTION',
  'ANTHROPIC_DEFAULT_SONNET_MODEL_DESCRIPTION',
  'ANTHROPIC_DEFAULT_HAIKU_MODEL_DESCRIPTION',
  'ANTHROPIC_DEFAULT_OPUS_MODEL_SUPPORTED_CAPABILITIES',
  'ANTHROPIC_DEFAULT_SONNET_MODEL_SUPPORTED_CAPABILITIES',
  'ANTHROPIC_DEFAULT_HAIKU_MODEL_SUPPORTED_CAPABILITIES',
  'ANTHROPIC_CUSTOM_MODEL_OPTION',
  'ANTHROPIC_CUSTOM_MODEL_OPTION_NAME',
  'ANTHROPIC_CUSTOM_MODEL_OPTION_DESCRIPTION',
  'ANTHROPIC_CUSTOM_MODEL_OPTION_SUPPORTED_CAPABILITIES',
  'ANTHROPIC_SMALL_FAST_MODEL',
  'CLAUDE_CODE_SUBAGENT_MODEL',
]);

const getManagedEnvKeysForUpdate = (profile: ProviderCapabilityProfile, existingKeys: string[] = []): string[] => {
  const keys = [...existingKeys, ...getManagedSettingsEnvKeys(profile)];
  if (profile.models.policy === 'required' || profile.models.policy === 'external') {
    return keys.filter((key) => !USER_OWNED_MODEL_KEYS.has(key));
  }
  return keys;
};

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
    const profile = getProviderCapability(meta.provider);
    const providerLabel = getProvider(meta.provider)?.label ?? meta.provider;
    if (!profile) {
      state.notes.push(`No capability profile found for ${meta.provider}; preserving existing settings.`);
      return;
    }

    ensureApiKeyApproval(meta.configDir);

    if (profile.auth.mode === 'authToken') {
      const authUpdated = ensureAuthTokenCredentialSettings(meta.configDir, {
        derivedCredentialEnv: profile.auth.derivedCredentialEnv,
        emptyApiKey: profile.auth.emptyApiKey,
        authTokenAlsoSetsApiKey: profile.auth.authTokenAlsoSetsApiKey,
        fallbackToken: profile.auth.fallbackToken,
      });
      if (authUpdated) {
        state.notes.push(`Updated ${providerLabel} auth settings.`);
      }
    }

    const baseUrl = resolveManagedBaseUrl(profile, meta.baseUrl);
    if (baseUrl && baseUrl !== meta.baseUrl) {
      meta.baseUrl = baseUrl;
    }

    const envDefaults = buildEnv({
      providerKey: meta.provider,
      baseUrl,
      modelOverrides: opts.modelOverrides,
    });
    envDefaults.TWEAKCC_CONFIG_DIR = meta.tweakDir;
    envDefaults.DISABLE_INSTALLATION_CHECKS = '1';

    const envDefaultsUpdated = syncSettingsManagedEnv(meta.configDir, {
      desiredEnv: envDefaults,
      managedKeys: [
        ...getManagedEnvKeysForUpdate(profile, meta.managed?.settingsEnvKeys),
        'DISABLE_AUTO_MIGRATE_TO_NATIVE',
        'CLAUDE_CODE_ENABLE_PROMPT_SUGGESTION',
        'ANTHROPIC_MODEL',
      ],
      credentialKeys: getCredentialKeys(profile),
      removeKeys: ['DISABLE_AUTO_MIGRATE_TO_NATIVE', 'CLAUDE_CODE_ENABLE_PROMPT_SUGGESTION', 'ANTHROPIC_MODEL'],
    });
    const startupModelUpdated = ensureSettingsModel(
      meta.configDir,
      resolveStartupModelSetting(profile, opts.modelOverrides)
    );
    const managedSettingsUpdated = syncSettingsManagedDefaults(
      meta.configDir,
      buildManagedClaudeSettings(profile, opts.modelOverrides)
    );

    const aliases = resolveModelAliases(profile, opts.modelOverrides);
    if (profile.models.staleModels && aliases.opus && aliases.sonnet && aliases.haiku) {
      const staleModelsUpdated = ensureSettingsModelMigration(meta.configDir, {
        staleModels: profile.models.staleModels,
        replacements: {
          opus: aliases.opus,
          sonnet: aliases.sonnet,
          haiku: aliases.haiku,
        },
      });
      if (staleModelsUpdated) {
        state.notes.push(`Updated stale ${providerLabel} model mapping.`);
      }
    }

    if (profile.claudeConfig.mcpServers.length > 0) {
      if (isAsync) {
        await ctx.report(`Configuring ${meta.provider} MCP servers...`);
      } else {
        ctx.report(`Configuring ${meta.provider} MCP servers...`);
      }
      const mcpUpdated = ensureManagedMcpServers(meta.configDir, profile.claudeConfig.mcpServers);
      if (mcpUpdated) {
        state.notes.push(`Configured ${providerLabel} MCP servers.`);
      }
    }

    if (profile.auth.mode === 'apiKey') {
      ensureSettingsEnvOverrides(meta.configDir, { CC_MIRROR_UNSET_AUTH_TOKEN: '1' });
    }

    ensureApiKeyApproval(meta.configDir);

    // Onboarding and theme
    const brandThemeId = !opts.noTweak && state.brandKey ? getBrandThemeId(state.brandKey) : null;
    const onboarding = ensureOnboardingState(meta.configDir, {
      themeId: brandThemeId ?? 'dark',
      forceTheme: Boolean(brandThemeId),
      skipOnboardingFlag: profile.claudeConfig.onboarding === 'skip',
    });
    const uiSuppressionsUpdated = ensureClaudeConfigUiSuppressions(meta.configDir);

    const denied = ensureSettingsPermissionsDeny(meta.configDir, profile.tools.deny);
    if (denied) {
      state.notes.push(`Applied ${providerLabel} required tool deny rules.`);
    }

    if (envDefaultsUpdated || startupModelUpdated || managedSettingsUpdated || uiSuppressionsUpdated) {
      state.notes.push('Refreshed managed runtime settings (updates/install checks/privacy/model/UI defaults).');
    }
    if (onboarding.themeChanged) {
      state.notes.push(`Default theme set to ${brandThemeId ?? 'dark'}.`);
    }
    if (onboarding.onboardingChanged) {
      state.notes.push('Onboarding marked complete.');
    }
  }
}
