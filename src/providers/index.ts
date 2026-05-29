import {
  buildCapabilityEnv,
  DEFAULT_PROVIDER_TIMEOUT_MS,
  getProviderCapability,
  KIMI_DEFAULT_MODEL,
  MINIMAX_DEFAULT_MODEL,
  NANOGPT_DEFAULT_MODELS,
  OLLAMA_DEFAULT_MODEL,
  PROVIDER_CAPABILITIES,
  resolveModelAliases,
  ZAI_DEFAULT_MODELS,
} from './capabilities.js';

export {
  buildCapabilityEnv,
  buildManagedClaudeSettings,
  buildCapabilityMetadata,
  getProviderCapability,
  MINIMAX_DEFAULT_MODEL,
  MINIMAX_DENY_TOOLS,
  MINIMAX_MCP_SERVER,
  MINIMAX_STALE_MODELS,
  NANOGPT_DEFAULT_MODELS,
  NANOGPT_DEFAULT_MODEL,
  OLLAMA_DEFAULT_MODEL,
  PROVIDER_CAPABILITIES,
  getManagedSettingsEnvKeys,
  resolveModelAliases,
  resolveAvailableModelsSetting,
  resolveStartupModelSetting,
  type ManagedClaudeSettings,
  type ProviderCapabilityProfile,
  type ProviderClass,
  type ManagedMcpServer,
  ZAI_DEFAULT_MODELS,
  ZAI_DENY_TOOLS,
  ZAI_STALE_MODELS,
} from './capabilities.js';

export const DEFAULT_TIMEOUT_MS = DEFAULT_PROVIDER_TIMEOUT_MS;

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

export const buildZaiModelEnv = (): ProviderEnv => ({
  ANTHROPIC_DEFAULT_HAIKU_MODEL: ZAI_DEFAULT_MODELS.haiku,
  ANTHROPIC_DEFAULT_SONNET_MODEL: ZAI_DEFAULT_MODELS.sonnet,
  ANTHROPIC_DEFAULT_OPUS_MODEL: ZAI_DEFAULT_MODELS.opus,
  ANTHROPIC_SMALL_FAST_MODEL: ZAI_DEFAULT_MODELS.haiku,
});

export const buildKimiModelEnv = (): ProviderEnv => ({
  ANTHROPIC_MODEL: KIMI_DEFAULT_MODEL,
  ANTHROPIC_DEFAULT_HAIKU_MODEL: KIMI_DEFAULT_MODEL,
  ANTHROPIC_DEFAULT_SONNET_MODEL: KIMI_DEFAULT_MODEL,
  ANTHROPIC_DEFAULT_OPUS_MODEL: KIMI_DEFAULT_MODEL,
  ANTHROPIC_SMALL_FAST_MODEL: KIMI_DEFAULT_MODEL,
});

export const buildMinimaxModelEnv = (): ProviderEnv => ({
  ANTHROPIC_MODEL: MINIMAX_DEFAULT_MODEL,
  ANTHROPIC_SMALL_FAST_MODEL: MINIMAX_DEFAULT_MODEL,
  ANTHROPIC_DEFAULT_SONNET_MODEL: MINIMAX_DEFAULT_MODEL,
  ANTHROPIC_DEFAULT_OPUS_MODEL: MINIMAX_DEFAULT_MODEL,
  ANTHROPIC_DEFAULT_HAIKU_MODEL: MINIMAX_DEFAULT_MODEL,
});

export const buildNanoGptModelEnv = (): ProviderEnv => ({
  ANTHROPIC_SMALL_FAST_MODEL: NANOGPT_DEFAULT_MODELS.haiku,
  ANTHROPIC_DEFAULT_SONNET_MODEL: NANOGPT_DEFAULT_MODELS.sonnet,
  ANTHROPIC_DEFAULT_OPUS_MODEL: NANOGPT_DEFAULT_MODELS.opus,
  ANTHROPIC_DEFAULT_HAIKU_MODEL: NANOGPT_DEFAULT_MODELS.haiku,
});

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
    label: 'Mirror',
    description: 'Isolated first-party runtime with clean defaults',
    baseUrl: '',
    env: {
      CC_MIRROR_SPLASH: 1,
      CC_MIRROR_PROVIDER_LABEL: 'Mirror',
      CC_MIRROR_SPLASH_STYLE: 'mirror',
    },
    apiKeyLabel: '',
    authMode: 'none',
    credentialOptional: true,
    noPromptPack: true,
    experimental: true,
  },
  zai: {
    key: 'zai',
    label: 'Zai Cloud',
    description: 'GLM-5.1/5-Turbo/4.5-Air via Z.ai Coding Plan',
    baseUrl: 'https://api.z.ai/api/anthropic',
    env: {
      API_TIMEOUT_MS: DEFAULT_TIMEOUT_MS,
      ...buildZaiModelEnv(),
      CC_MIRROR_SPLASH: 1,
      CC_MIRROR_PROVIDER_LABEL: 'Zai Cloud',
      CC_MIRROR_SPLASH_STYLE: 'zai',
    },
    apiKeyLabel: 'Zai API key',
    authMode: 'authToken',
    requiresEmptyApiKey: true,
  },
  minimax: {
    key: 'minimax',
    label: 'MiniMax Cloud',
    description: 'MiniMax-M2.7 via MiniMax Token Plan',
    baseUrl: 'https://api.minimax.io/anthropic',
    env: {
      API_TIMEOUT_MS: DEFAULT_TIMEOUT_MS,
      CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: 1,
      ...buildMinimaxModelEnv(),
      CC_MIRROR_SPLASH: 1,
      CC_MIRROR_PROVIDER_LABEL: 'MiniMax Cloud',
      CC_MIRROR_SPLASH_STYLE: 'minimax',
    },
    apiKeyLabel: 'MiniMax API key',
    authMode: 'authToken',
    requiresEmptyApiKey: true,
  },
  kimi: {
    key: 'kimi',
    label: 'Kimi Code',
    description: 'Kimi K2.6 via Moonshot',
    baseUrl: 'https://api.moonshot.ai/anthropic',
    env: {
      API_TIMEOUT_MS: DEFAULT_TIMEOUT_MS,
      ...buildKimiModelEnv(),
      CLAUDE_CODE_SUBAGENT_MODEL: KIMI_DEFAULT_MODEL,
      CC_MIRROR_SPLASH: 1,
      CC_MIRROR_PROVIDER_LABEL: 'Kimi Code',
      CC_MIRROR_SPLASH_STYLE: 'kimi',
    },
    apiKeyLabel: 'Kimi API key',
    authMode: 'authToken',
    requiresEmptyApiKey: true,
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
      ANTHROPIC_SMALL_FAST_MODEL: OLLAMA_DEFAULT_MODEL,
      ANTHROPIC_AUTH_TOKEN: 'ollama',
      ANTHROPIC_API_KEY: 'ollama',
      ANTHROPIC_DEFAULT_SONNET_MODEL: OLLAMA_DEFAULT_MODEL,
      ANTHROPIC_DEFAULT_OPUS_MODEL: OLLAMA_DEFAULT_MODEL,
      ANTHROPIC_DEFAULT_HAIKU_MODEL: OLLAMA_DEFAULT_MODEL,
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
    baseUrl: 'https://nano-gpt.com/api/v1',
    env: {
      API_TIMEOUT_MS: '600000',
      ...buildNanoGptModelEnv(),
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

const syncCompatibilityModelDefaults = (env: ProviderEnv, skipSmallFastSync = false) => {
  // Keep legacy small-fast setting aligned with Haiku alias unless explicitly overridden.
  if (!skipSmallFastSync) {
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
  const profile = getProviderCapability(providerKey);
  if (!profile) {
    throw new Error(`Unknown provider capability profile: ${providerKey}`);
  }

  const env = buildCapabilityEnv({
    profile,
    baseEnv: provider.env,
    baseUrl,
    apiKey,
    extraEnv,
    modelOverrides,
  });

  // Keep older public helpers behaving as before when callers use them directly.
  applyModelOverrides(env, modelOverrides);
  syncCompatibilityModelDefaults(env, normalizeModelValue(modelOverrides?.smallFast).length > 0);

  return env;
};

export const providerRequiresModelMapping = (providerKey: string): boolean =>
  getProviderCapability(providerKey)?.models.policy === 'required';

export const getProviderModelDefaults = (providerKey: string): Partial<Record<'opus' | 'sonnet' | 'haiku', string>> =>
  resolveModelAliases(getProviderCapability(providerKey) ?? PROVIDER_CAPABILITIES.custom);

export const PROVIDER_TEMPLATES = PROVIDERS;
