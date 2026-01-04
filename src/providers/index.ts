export const DEFAULT_TIMEOUT_MS = '3000000';

export type ProviderEnv = Record<string, string | number>;

export type ProviderAuthMode = 'apiKey' | 'authToken' | 'none';

export interface ProviderTemplate {
  key: string;
  label: string;
  description: string;
  baseUrl: string;
  env: ProviderEnv;
  apiKeyLabel: string;
  authMode?: ProviderAuthMode;
  requiresModelMapping?: boolean;
  credentialOptional?: boolean;
  /** Mark as experimental/coming soon - hidden from main provider list */
  experimental?: boolean;
  /** Auto-enable team mode patch for this provider */
  enablesTeamMode?: boolean;
  /** Skip prompt pack overlays (pure Claude experience) */
  noPromptPack?: boolean;
}

export interface ModelOverrides {
  sonnet?: string;
  opus?: string;
  haiku?: string;
  smallFast?: string;
  defaultModel?: string;
  subagentModel?: string;
}

const CCROUTER_AUTH_FALLBACK = 'ccrouter-proxy';

const PROVIDERS: Record<string, ProviderTemplate> = {
  zai: {
    key: 'zai',
    label: 'Zai Cloud',
    description: 'GLM Coding Plan via Anthropic-compatible endpoint',
    baseUrl: 'https://api.z.ai/api/anthropic',
    env: {
      API_TIMEOUT_MS: DEFAULT_TIMEOUT_MS,
      ANTHROPIC_DEFAULT_HAIKU_MODEL: 'glm-4.5-air',
      ANTHROPIC_DEFAULT_SONNET_MODEL: 'glm-4.7',
      ANTHROPIC_DEFAULT_OPUS_MODEL: 'glm-4.7',
      CC_MIRROR_SPLASH: 1,
      CC_MIRROR_PROVIDER_LABEL: 'Zai Cloud',
      CC_MIRROR_SPLASH_STYLE: 'zai',
    },
    apiKeyLabel: 'Zai API key',
  },
  minimax: {
    key: 'minimax',
    label: 'MiniMax Cloud',
    description: 'MiniMax-M2.1 via Anthropic-compatible endpoint',
    baseUrl: 'https://api.minimax.io/anthropic',
    env: {
      API_TIMEOUT_MS: DEFAULT_TIMEOUT_MS,
      CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: 1,
      ANTHROPIC_MODEL: 'MiniMax-M2.1',
      ANTHROPIC_SMALL_FAST_MODEL: 'MiniMax-M2.1',
      ANTHROPIC_DEFAULT_SONNET_MODEL: 'MiniMax-M2.1',
      ANTHROPIC_DEFAULT_OPUS_MODEL: 'MiniMax-M2.1',
      ANTHROPIC_DEFAULT_HAIKU_MODEL: 'MiniMax-M2.1',
      CC_MIRROR_SPLASH: 1,
      CC_MIRROR_PROVIDER_LABEL: 'MiniMax Cloud',
      CC_MIRROR_SPLASH_STYLE: 'minimax',
    },
    apiKeyLabel: 'MiniMax API key',
  },
  openrouter: {
    key: 'openrouter',
    label: 'OpenRouter',
    description: 'OpenRouter gateway for Anthropic-compatible requests',
    baseUrl: 'https://openrouter.ai/api',
    env: {
      API_TIMEOUT_MS: DEFAULT_TIMEOUT_MS,
      CC_MIRROR_SPLASH: 1,
      CC_MIRROR_PROVIDER_LABEL: 'OpenRouter',
      CC_MIRROR_SPLASH_STYLE: 'openrouter',
    },
    apiKeyLabel: 'OpenRouter API key',
    authMode: 'authToken',
    requiresModelMapping: true,
  },
  ccrouter: {
    key: 'ccrouter',
    label: 'Claude Code Router',
    description: 'Route requests to any model via Claude Code Router',
    baseUrl: 'http://127.0.0.1:3456',
    env: {
      API_TIMEOUT_MS: DEFAULT_TIMEOUT_MS,
      CC_MIRROR_SPLASH: 1,
      CC_MIRROR_PROVIDER_LABEL: 'Claude Code Router',
      CC_MIRROR_SPLASH_STYLE: 'ccrouter',
    },
    apiKeyLabel: 'Router URL',
    authMode: 'authToken',
    requiresModelMapping: false, // Models configured in ~/.claude-code-router/config.json
    credentialOptional: true, // No API key needed - CCRouter handles auth
  },
  mirror: {
    key: 'mirror',
    label: 'Mirror Claude',
    description: 'Pure Claude Code with advanced features (team mode, custom theme)',
    baseUrl: '', // Empty = use Claude Code defaults (no ANTHROPIC_BASE_URL override)
    env: {
      // Only cosmetic settings - no auth or model overrides
      CC_MIRROR_SPLASH: 1,
      CC_MIRROR_PROVIDER_LABEL: 'Mirror Claude',
      CC_MIRROR_SPLASH_STYLE: 'mirror',
    },
    apiKeyLabel: '', // Empty = skip API key prompt
    authMode: 'none', // No auth handling - user authenticates via normal Claude flow
    credentialOptional: true, // No credentials required at create time
    enablesTeamMode: true, // Auto-enable team mode patch
    noPromptPack: true, // Skip prompt pack (pure Claude experience)
  },
  custom: {
    key: 'custom',
    label: 'Custom',
    description: 'Coming Soon — Bring your own endpoint',
    baseUrl: '',
    env: {
      API_TIMEOUT_MS: DEFAULT_TIMEOUT_MS,
    },
    apiKeyLabel: 'API key',
    experimental: true,
  },
};

export const getProvider = (key: string): ProviderTemplate | undefined => PROVIDERS[key];

/**
 * List available providers
 * @param includeExperimental - Set to true to include experimental/coming soon providers
 */
export const listProviders = (includeExperimental = false): ProviderTemplate[] => {
  const providers = Object.values(PROVIDERS);
  if (includeExperimental) {
    return providers;
  }
  return providers.filter((p) => !p.experimental);
};

export interface BuildEnvParams {
  providerKey: string;
  baseUrl?: string;
  apiKey?: string;
  extraEnv?: string[];
  modelOverrides?: ModelOverrides;
}

const normalizeModelValue = (value?: string) => (value ?? '').trim();

const applyModelOverrides = (env: ProviderEnv, overrides?: ModelOverrides) => {
  if (!overrides) return;
  const entries: Array<[string, string | undefined]> = [
    ['ANTHROPIC_DEFAULT_SONNET_MODEL', overrides.sonnet],
    ['ANTHROPIC_DEFAULT_OPUS_MODEL', overrides.opus],
    ['ANTHROPIC_DEFAULT_HAIKU_MODEL', overrides.haiku],
    ['ANTHROPIC_SMALL_FAST_MODEL', overrides.smallFast],
    ['ANTHROPIC_MODEL', overrides.defaultModel],
    ['CLAUDE_CODE_SUBAGENT_MODEL', overrides.subagentModel],
  ];
  for (const [key, value] of entries) {
    const trimmed = normalizeModelValue(value);
    if (trimmed) {
      env[key] = trimmed;
    }
  }
};

export const buildEnv = ({ providerKey, baseUrl, apiKey, extraEnv, modelOverrides }: BuildEnvParams): ProviderEnv => {
  const provider = getProvider(providerKey);
  if (!provider) {
    throw new Error(`Unknown provider: ${providerKey}`);
  }

  const env: ProviderEnv = { ...provider.env };
  const authMode = provider.authMode ?? 'apiKey';

  // For 'none' authMode, only apply cosmetic env vars - no auth or base URL
  if (authMode === 'none') {
    // Still allow extraEnv for user customization
    if (Array.isArray(extraEnv)) {
      for (const entry of extraEnv) {
        const idx = entry.indexOf('=');
        if (idx === -1) continue;
        const key = entry.slice(0, idx).trim();
        const value = entry.slice(idx + 1).trim();
        if (!key) continue;
        env[key] = value;
      }
    }
    return env;
  }

  if (!Object.hasOwn(env, 'DISABLE_AUTOUPDATER')) {
    env.DISABLE_AUTOUPDATER = '1';
  }
  if (!Object.hasOwn(env, 'CLAUDE_CODE_ENABLE_PROMPT_SUGGESTION')) {
    env.CLAUDE_CODE_ENABLE_PROMPT_SUGGESTION = '1';
  }
  if (baseUrl) env.ANTHROPIC_BASE_URL = baseUrl;
  if (authMode === 'authToken') {
    const trimmed = normalizeModelValue(apiKey);
    if (trimmed) {
      env.ANTHROPIC_AUTH_TOKEN = trimmed;
    } else if (providerKey === 'ccrouter') {
      env.ANTHROPIC_AUTH_TOKEN = CCROUTER_AUTH_FALLBACK;
    }
    if (Object.hasOwn(env, 'ANTHROPIC_API_KEY')) {
      delete env.ANTHROPIC_API_KEY;
    }
  } else if (apiKey) {
    env.ANTHROPIC_API_KEY = apiKey;
    env.CC_MIRROR_UNSET_AUTH_TOKEN = '1';
    if (providerKey === 'zai') {
      env.Z_AI_API_KEY = apiKey;
    }
  } else if (authMode === 'apiKey') {
    env.CC_MIRROR_UNSET_AUTH_TOKEN = '1';
  }

  applyModelOverrides(env, modelOverrides);

  if (Array.isArray(extraEnv)) {
    for (const entry of extraEnv) {
      const idx = entry.indexOf('=');
      if (idx === -1) continue;
      const key = entry.slice(0, idx).trim();
      const value = entry.slice(idx + 1).trim();
      if (!key) continue;
      env[key] = value;
    }
  }

  if (authMode === 'authToken' && Object.hasOwn(env, 'ANTHROPIC_API_KEY')) {
    delete env.ANTHROPIC_API_KEY;
  }
  if (authMode !== 'authToken' && Object.hasOwn(env, 'ANTHROPIC_AUTH_TOKEN')) {
    delete env.ANTHROPIC_AUTH_TOKEN;
  }

  return env;
};

export const PROVIDER_TEMPLATES = PROVIDERS;
