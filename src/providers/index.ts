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
  /** Skip prompt pack overlays (pure Claude experience) */
  noPromptPack?: boolean;
  /** Require empty ANTHROPIC_API_KEY (for authToken providers like Vercel AI Gateway) */
  requiresEmptyApiKey?: boolean;
  /** Keep ANTHROPIC_API_KEY alongside auth token (e.g., Ollama compatibility) */
  authTokenAlsoSetsApiKey?: boolean;
  /** Default variant/CLI name when --name is omitted (avoids shadowing real CLIs) */
  defaultVariantName?: string;
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

// Canonical provider display order for CLI/TUI and docs-facing flows.
// Any provider not listed here is appended after these entries.
export const PROVIDER_DISPLAY_ORDER = [
  'kimi',
  'minimax',
  'zai',
  'openrouter',
  'vercel',
  'ollama',
  'nanogpt',
  'ccrouter',
  'mirror',
  'gatewayz',
  'custom',
] as const;

const PROVIDER_DISPLAY_ORDER_INDEX = new Map<string, number>(PROVIDER_DISPLAY_ORDER.map((key, index) => [key, index]));

const PROVIDERS: Record<string, ProviderTemplate> = {
  mirror: {
    key: 'mirror',
    label: 'Mirror Claude',
    description: 'Pure Claude with isolated config and clean defaults',
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
    noPromptPack: true, // Skip prompt pack (pure Claude experience)
    experimental: true, // Hidden — theming ported to OpenRouter
  },
  zai: {
    key: 'zai',
    label: 'Zai Cloud',
    description: 'GLM-5/4.7/4.5-Air via Z.ai Coding Plan',
    baseUrl: 'https://api.z.ai/api/anthropic',
    env: {
      API_TIMEOUT_MS: DEFAULT_TIMEOUT_MS,
      ANTHROPIC_DEFAULT_HAIKU_MODEL: 'glm-4.5-air',
      ANTHROPIC_DEFAULT_SONNET_MODEL: 'glm-4.7',
      ANTHROPIC_DEFAULT_OPUS_MODEL: 'glm-5',
      CC_MIRROR_SPLASH: 1,
      CC_MIRROR_PROVIDER_LABEL: 'Zai Cloud',
      CC_MIRROR_SPLASH_STYLE: 'zai',
    },
    apiKeyLabel: 'Zai API key',
  },
  minimax: {
    key: 'minimax',
    label: 'MiniMax Cloud',
    description: 'MiniMax via MiniMax Cloud',
    baseUrl: 'https://api.minimax.io/anthropic',
    env: {
      API_TIMEOUT_MS: DEFAULT_TIMEOUT_MS,
      CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: 1,
      ANTHROPIC_MODEL: 'MiniMax-M2.5',
      ANTHROPIC_SMALL_FAST_MODEL: 'MiniMax-M2.5',
      ANTHROPIC_DEFAULT_SONNET_MODEL: 'MiniMax-M2.5',
      ANTHROPIC_DEFAULT_OPUS_MODEL: 'MiniMax-M2.5',
      ANTHROPIC_DEFAULT_HAIKU_MODEL: 'MiniMax-M2.5',
      CC_MIRROR_SPLASH: 1,
      CC_MIRROR_PROVIDER_LABEL: 'MiniMax Cloud',
      CC_MIRROR_SPLASH_STYLE: 'minimax',
    },
    apiKeyLabel: 'MiniMax API key',
  },
  kimi: {
    key: 'kimi',
    label: 'Kimi Code',
    description: 'kimi-for-coding via Kimi Code (K2.5)',
    baseUrl: 'https://api.kimi.com/coding/',
    env: {
      API_TIMEOUT_MS: DEFAULT_TIMEOUT_MS,
      ANTHROPIC_DEFAULT_HAIKU_MODEL: 'kimi-for-coding',
      ANTHROPIC_DEFAULT_SONNET_MODEL: 'kimi-for-coding',
      ANTHROPIC_DEFAULT_OPUS_MODEL: 'kimi-for-coding',
      CC_MIRROR_SPLASH: 1,
      CC_MIRROR_PROVIDER_LABEL: 'Kimi Code',
      CC_MIRROR_SPLASH_STYLE: 'kimi',
    },
    apiKeyLabel: 'Kimi API key',
  },
  openrouter: {
    key: 'openrouter',
    label: 'OpenRouter',
    description: '100+ models via OpenRouter gateway',
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
    label: 'CC Router',
    description: 'Local LLMs via CC Router',
    baseUrl: 'http://127.0.0.1:3456',
    env: {
      API_TIMEOUT_MS: DEFAULT_TIMEOUT_MS,
      CC_MIRROR_SPLASH: 1,
      CC_MIRROR_PROVIDER_LABEL: 'CC Router',
      CC_MIRROR_SPLASH_STYLE: 'ccrouter',
    },
    apiKeyLabel: 'Router URL',
    authMode: 'authToken',
    requiresModelMapping: false, // Models configured in ~/.claude-code-router/config.json
    credentialOptional: true, // No API key needed - CCRouter handles auth
  },
  ollama: {
    key: 'ollama',
    label: 'Ollama',
    description: 'Local + cloud models via Ollama',
    defaultVariantName: 'ccollama',
    baseUrl: 'http://localhost:11434',
    env: {
      API_TIMEOUT_MS: DEFAULT_TIMEOUT_MS,
      ANTHROPIC_AUTH_TOKEN: 'ollama',
      ANTHROPIC_API_KEY: 'ollama',
      ANTHROPIC_DEFAULT_SONNET_MODEL: 'qwen3-coder',
      ANTHROPIC_DEFAULT_OPUS_MODEL: 'qwen3-coder',
      ANTHROPIC_DEFAULT_HAIKU_MODEL: 'qwen3-coder',
      CC_MIRROR_SPLASH: 1,
      CC_MIRROR_PROVIDER_LABEL: 'Ollama',
      CC_MIRROR_SPLASH_STYLE: 'ollama',
    },
    apiKeyLabel: 'Ollama API key (use "ollama" for local)',
    authMode: 'authToken',
    authTokenAlsoSetsApiKey: true,
    requiresModelMapping: true,
  },
  gatewayz: {
    key: 'gatewayz',
    label: 'GatewayZ',
    description: 'GatewayZ AI Gateway',
    baseUrl: 'https://api.gatewayz.ai',
    env: {
      API_TIMEOUT_MS: DEFAULT_TIMEOUT_MS,
      CC_MIRROR_SPLASH: 1,
      CC_MIRROR_PROVIDER_LABEL: 'GatewayZ',
      CC_MIRROR_SPLASH_STYLE: 'gatewayz',
    },
    apiKeyLabel: 'GatewayZ API key',
    authMode: 'authToken',
    requiresModelMapping: true,
  },
  vercel: {
    key: 'vercel',
    label: 'Vercel AI Gateway',
    description: 'Vercel AI Gateway',
    defaultVariantName: 'ccvercel',
    baseUrl: 'https://ai-gateway.vercel.sh',
    env: {
      API_TIMEOUT_MS: DEFAULT_TIMEOUT_MS,
      CC_MIRROR_SPLASH: 1,
      CC_MIRROR_PROVIDER_LABEL: 'Vercel AI Gateway',
      CC_MIRROR_SPLASH_STYLE: 'vercel',
    },
    apiKeyLabel: 'Vercel AI Gateway API key',
    authMode: 'authToken',
    requiresModelMapping: true,
    requiresEmptyApiKey: true,
  },
  nanogpt: {
    key: 'nanogpt',
    label: 'NanoGPT',
    description: '400+ models via NanoGPT gateway',
    baseUrl: 'https://nano-gpt.com/api',
    env: {
      API_TIMEOUT_MS: DEFAULT_TIMEOUT_MS,
      ANTHROPIC_DEFAULT_SONNET_MODEL: 'moonshotai/kimi-k2.5',
      ANTHROPIC_DEFAULT_OPUS_MODEL: 'moonshotai/kimi-k2.5',
      ANTHROPIC_DEFAULT_HAIKU_MODEL: 'moonshotai/kimi-k2.5',
      CC_MIRROR_SPLASH: 1,
      CC_MIRROR_PROVIDER_LABEL: 'NanoGPT',
      CC_MIRROR_SPLASH_STYLE: 'nanogpt',
    },
    apiKeyLabel: 'NanoGPT API key',
    authMode: 'authToken',
    requiresModelMapping: true,
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
  const providers = Object.values(PROVIDERS).filter((p) => includeExperimental || !p.experimental);
  return providers.sort((a, b) => {
    const aOrder = PROVIDER_DISPLAY_ORDER_INDEX.get(a.key) ?? Number.MAX_SAFE_INTEGER;
    const bOrder = PROVIDER_DISPLAY_ORDER_INDEX.get(b.key) ?? Number.MAX_SAFE_INTEGER;
    if (aOrder !== bOrder) return aOrder - bOrder;
    if (a.experimental !== b.experimental) return a.experimental ? 1 : -1;
    return a.label.localeCompare(b.label);
  });
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

const getEnvModelValue = (env: ProviderEnv, key: string): string => {
  const raw = env[key];
  if (typeof raw === 'string') return normalizeModelValue(raw);
  if (typeof raw === 'number') return normalizeModelValue(String(raw));
  return '';
};

const syncCompatibilityModelDefaults = (
  env: ProviderEnv,
  opts: {
    skipDefaultModelSync?: boolean;
    skipSmallFastSync?: boolean;
  } = {}
) => {
  // Keep startup/default model aligned with Opus alias unless explicitly overridden.
  if (!opts.skipDefaultModelSync) {
    const opus = getEnvModelValue(env, 'ANTHROPIC_DEFAULT_OPUS_MODEL');
    if (opus) {
      env.ANTHROPIC_MODEL = opus;
    }
  }

  // Keep legacy small-fast setting aligned with Haiku alias unless explicitly overridden.
  if (!opts.skipSmallFastSync) {
    const haiku = getEnvModelValue(env, 'ANTHROPIC_DEFAULT_HAIKU_MODEL');
    if (haiku) {
      env.ANTHROPIC_SMALL_FAST_MODEL = haiku;
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
  if (!Object.hasOwn(env, 'DISABLE_AUTO_MIGRATE_TO_NATIVE')) {
    env.DISABLE_AUTO_MIGRATE_TO_NATIVE = '1';
  }
  if (!Object.hasOwn(env, 'CLAUDE_CODE_ENABLE_PROMPT_SUGGESTION')) {
    env.CLAUDE_CODE_ENABLE_PROMPT_SUGGESTION = '1';
  }
  if (baseUrl) env.ANTHROPIC_BASE_URL = baseUrl;
  if (authMode === 'authToken') {
    const trimmed = normalizeModelValue(apiKey);
    if (trimmed) {
      env.ANTHROPIC_AUTH_TOKEN = trimmed;
      if (provider.authTokenAlsoSetsApiKey) {
        env.ANTHROPIC_API_KEY = trimmed;
      }
    } else if (providerKey === 'ccrouter') {
      env.ANTHROPIC_AUTH_TOKEN = CCROUTER_AUTH_FALLBACK;
      if (provider.authTokenAlsoSetsApiKey) {
        env.ANTHROPIC_API_KEY = CCROUTER_AUTH_FALLBACK;
      }
    }
    if (!provider.authTokenAlsoSetsApiKey && Object.hasOwn(env, 'ANTHROPIC_API_KEY')) {
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
  syncCompatibilityModelDefaults(env, {
    skipDefaultModelSync: normalizeModelValue(modelOverrides?.defaultModel).length > 0,
    skipSmallFastSync: normalizeModelValue(modelOverrides?.smallFast).length > 0,
  });

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

  if (authMode === 'authToken') {
    if (provider.requiresEmptyApiKey) {
      env.ANTHROPIC_API_KEY = '';
    } else if (!provider.authTokenAlsoSetsApiKey && Object.hasOwn(env, 'ANTHROPIC_API_KEY')) {
      delete env.ANTHROPIC_API_KEY;
    }
  }
  if (authMode !== 'authToken' && Object.hasOwn(env, 'ANTHROPIC_AUTH_TOKEN')) {
    delete env.ANTHROPIC_AUTH_TOKEN;
  }

  return env;
};

export const PROVIDER_TEMPLATES = PROVIDERS;
