import type { ModelOverrides, ProviderEnv, ProviderAuthMode } from './index.js';

export type ProviderClass = 'firstParty' | 'hostedApiKey' | 'hostedAuthToken' | 'authTokenAlsoApiKey' | 'localRouter';

export type ModelAlias = 'opus' | 'sonnet' | 'haiku';

export type ModelPolicy = 'none' | 'defaulted' | 'required' | 'external';

export interface ModelAliasDisplay {
  name: string;
  description?: string;
  supportedCapabilities?: string[];
}

export interface ManagedClaudeSettings {
  companyAnnouncements: string[];
  spinnerTipsEnabled: boolean;
  feedbackSurveyRate: number;
  includeCoAuthoredBy: boolean;
  attribution: {
    commit: string;
    pr: string;
  };
  availableModels?: string[];
}

export interface ManagedMcpServer {
  id: string;
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  url?: string;
  headers?: string[];
  transport?: string;
}

export interface ProviderCapabilityProfile {
  key: string;
  version: number;
  providerClass: ProviderClass;
  auth: {
    mode: ProviderAuthMode;
    required: boolean;
    credentialEnv?: 'ANTHROPIC_API_KEY' | 'ANTHROPIC_AUTH_TOKEN';
    emptyApiKey?: boolean;
    authTokenAlsoSetsApiKey?: boolean;
    fallbackToken?: string;
    derivedCredentialEnv?: string[];
    unsetAmbientAuthToken?: boolean;
  };
  endpoint: {
    managed: boolean;
    defaultBaseUrl?: string;
    staleBaseUrls?: readonly string[];
    editable: boolean;
  };
  models: {
    policy: ModelPolicy;
    aliases?: Partial<Record<ModelAlias, string>>;
    display?: Partial<Record<ModelAlias, ModelAliasDisplay>>;
    customModelOption?: ModelAliasDisplay & { model: string };
    startupAlias?: ModelAlias;
    startupEnv?: 'ANTHROPIC_MODEL';
    smallFastAlias?: ModelAlias;
    subagentModel?: string;
    staleModels?: readonly string[];
  };
  runtime: {
    updatePolicy: 'ccMirrorManaged' | 'upstream';
    nonessentialTraffic: 'allow' | 'disable';
    apiTimeoutMs?: string;
    suppressInstallChecks: boolean;
  };
  features: {
    promptPack: { supported: boolean; defaultEnabled: boolean };
    browserSkill: { supported: boolean; defaultEnabled: boolean };
    shellEnv: { supported: boolean; defaultEnabled: boolean; exports: string[] };
    tweakcc: { defaultEnabled: boolean; profile: 'recommended' | 'conservative' | 'experimental' | 'vanilla' };
  };
  tools: {
    webMode: 'native' | 'providerReplacement' | 'off' | 'external';
    deny: string[];
  };
  claudeConfig: {
    onboarding: 'complete' | 'skip';
    approveCredential: boolean;
    mcpServers: ManagedMcpServer[];
  };
}

export const CCROUTER_AUTH_FALLBACK = 'ccrouter-proxy';
export const DEFAULT_PROVIDER_TIMEOUT_MS = '3000000';

export const ZAI_DEFAULT_MODELS = {
  opus: 'glm-5.1',
  sonnet: 'glm-5-turbo',
  haiku: 'glm-4.5-air',
} as const;

export const ZAI_STALE_MODELS = ['pony-alpha-2', 'glm-5', 'glm-4.7'] as const;

export const KIMI_DEFAULT_MODEL = 'kimi-k2.6';
export const KIMI_STALE_MODELS = ['kimi-for-coding', 'kimi-k2.5'] as const;

export const MINIMAX_DEFAULT_MODEL = 'MiniMax-M2.7';
export const MINIMAX_STALE_MODELS = ['MiniMax-M2.5'] as const;

export const NANOGPT_DEFAULT_MODEL = 'openai/gpt-5.2';
export const NANOGPT_DEFAULT_MODELS = {
  opus: 'openai/gpt-5.2',
  sonnet: 'openai/gpt-5.2',
  haiku: 'google/gemini-3-flash-preview',
} as const;
export const NANOGPT_STALE_MODELS = ['moonshotai/kimi-k2.5'] as const;
export const OLLAMA_DEFAULT_MODEL = 'qwen3.5';

export const ZAI_DENY_TOOLS = [
  'mcp__4_5v_mcp__analyze_image',
  'mcp__milk_tea_server__claim_milk_tea_coupon',
  'mcp__web_reader__webReader',
  'WebSearch',
  'WebFetch',
];

export const MINIMAX_DENY_TOOLS = ['WebSearch'];

export const MINIMAX_MCP_SERVER: ManagedMcpServer = {
  id: 'MiniMax',
  command: 'uvx',
  args: ['minimax-coding-plan-mcp', '-y'],
  env: {
    MINIMAX_API_KEY: '${credential}',
    MINIMAX_API_HOST: 'https://api.minimax.io',
  },
};

const hostedRuntime = (apiTimeoutMs = DEFAULT_PROVIDER_TIMEOUT_MS): ProviderCapabilityProfile['runtime'] => ({
  updatePolicy: 'ccMirrorManaged',
  nonessentialTraffic: 'disable',
  apiTimeoutMs,
  suppressInstallChecks: true,
});

const firstPartyRuntime = (): ProviderCapabilityProfile['runtime'] => ({
  updatePolicy: 'ccMirrorManaged',
  nonessentialTraffic: 'disable',
  suppressInstallChecks: true,
});

const aliasesFromSingleModel = (model: string): Record<ModelAlias, string> => ({
  opus: model,
  sonnet: model,
  haiku: model,
});

const displayFromSingleModel = (label: string, description: string): Record<ModelAlias, ModelAliasDisplay> => ({
  opus: { name: label, description },
  sonnet: { name: label, description },
  haiku: { name: label, description },
});

const MODEL_ALIAS_ENV_NAMES: Record<ModelAlias, 'OPUS' | 'SONNET' | 'HAIKU'> = {
  opus: 'OPUS',
  sonnet: 'SONNET',
  haiku: 'HAIKU',
};

const MODEL_DISPLAY_ENV_SUFFIXES = ['MODEL_NAME', 'MODEL_DESCRIPTION', 'MODEL_SUPPORTED_CAPABILITIES'] as const;

export const buildModelDisplayEnv = (
  display?: Partial<Record<ModelAlias, ModelAliasDisplay>>
): Record<string, string> => {
  const env: Record<string, string> = {};
  if (!display) return env;
  for (const alias of Object.keys(MODEL_ALIAS_ENV_NAMES) as ModelAlias[]) {
    const entry = display[alias];
    if (!entry) continue;
    const prefix = `ANTHROPIC_DEFAULT_${MODEL_ALIAS_ENV_NAMES[alias]}_`;
    env[`${prefix}MODEL_NAME`] = entry.name;
    if (entry.description) env[`${prefix}MODEL_DESCRIPTION`] = entry.description;
    if (entry.supportedCapabilities?.length) {
      env[`${prefix}MODEL_SUPPORTED_CAPABILITIES`] = entry.supportedCapabilities.join(',');
    }
  }
  return env;
};

export const buildCustomModelOptionEnv = (
  customModelOption?: ProviderCapabilityProfile['models']['customModelOption']
): Record<string, string> => {
  if (!customModelOption) return {};
  const env: Record<string, string> = {
    ANTHROPIC_CUSTOM_MODEL_OPTION: customModelOption.model,
    ANTHROPIC_CUSTOM_MODEL_OPTION_NAME: customModelOption.name,
  };
  if (customModelOption.description) {
    env.ANTHROPIC_CUSTOM_MODEL_OPTION_DESCRIPTION = customModelOption.description;
  }
  if (customModelOption.supportedCapabilities?.length) {
    env.ANTHROPIC_CUSTOM_MODEL_OPTION_SUPPORTED_CAPABILITIES = customModelOption.supportedCapabilities.join(',');
  }
  return env;
};

export const getManagedSettingsEnvKeys = (profile?: ProviderCapabilityProfile): string[] => {
  const keys = [
    'TWEAKCC_CONFIG_DIR',
    'DISABLE_INSTALLATION_CHECKS',
    'DISABLE_UPDATES',
    'DISABLE_AUTOUPDATER',
    'DISABLE_TELEMETRY',
    'DISABLE_ERROR_REPORTING',
    'DISABLE_GROWTHBOOK',
    'DISABLE_BUG_COMMAND',
    'DISABLE_FEEDBACK_COMMAND',
    'DISABLE_LOGIN_COMMAND',
    'DISABLE_LOGOUT_COMMAND',
    'DISABLE_UPGRADE_COMMAND',
    'ENABLE_CLAUDEAI_MCP_SERVERS',
    'ENABLE_TOOL_SEARCH',
    'CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC',
    'CLAUDE_CODE_DISABLE_OFFICIAL_MARKETPLACE_AUTOINSTALL',
    'CLAUDE_CODE_ENABLE_GATEWAY_MODEL_DISCOVERY',
    'CC_MIRROR_UNSET_AUTH_TOKEN',
    'ANTHROPIC_BASE_URL',
    'ANTHROPIC_API_KEY',
    'ANTHROPIC_AUTH_TOKEN',
    'Z_AI_API_KEY',
    'ANTHROPIC_DEFAULT_OPUS_MODEL',
    'ANTHROPIC_DEFAULT_SONNET_MODEL',
    'ANTHROPIC_DEFAULT_HAIKU_MODEL',
    'ANTHROPIC_MODEL',
    'ANTHROPIC_SMALL_FAST_MODEL',
    'CLAUDE_CODE_SUBAGENT_MODEL',
    'ANTHROPIC_CUSTOM_MODEL_OPTION',
    'ANTHROPIC_CUSTOM_MODEL_OPTION_NAME',
    'ANTHROPIC_CUSTOM_MODEL_OPTION_DESCRIPTION',
    'ANTHROPIC_CUSTOM_MODEL_OPTION_SUPPORTED_CAPABILITIES',
    'API_TIMEOUT_MS',
  ];
  for (const alias of Object.values(MODEL_ALIAS_ENV_NAMES)) {
    for (const suffix of MODEL_DISPLAY_ENV_SUFFIXES) {
      keys.push(`ANTHROPIC_DEFAULT_${alias}_${suffix}`);
    }
  }
  if (profile?.auth.derivedCredentialEnv) keys.push(...profile.auth.derivedCredentialEnv);
  return [...new Set(keys)];
};

export const PROVIDER_CAPABILITIES: Record<string, ProviderCapabilityProfile> = {
  mirror: {
    key: 'mirror',
    version: 1,
    providerClass: 'firstParty',
    auth: { mode: 'none', required: false },
    endpoint: { managed: false, editable: false },
    models: { policy: 'none' },
    runtime: firstPartyRuntime(),
    features: {
      promptPack: { supported: false, defaultEnabled: false },
      browserSkill: { supported: true, defaultEnabled: false },
      shellEnv: { supported: false, defaultEnabled: false, exports: [] },
      tweakcc: { defaultEnabled: true, profile: 'vanilla' },
    },
    tools: { webMode: 'native', deny: [] },
    claudeConfig: { onboarding: 'skip', approveCredential: false, mcpServers: [] },
  },
  zai: {
    key: 'zai',
    version: 1,
    providerClass: 'hostedAuthToken',
    auth: {
      mode: 'authToken',
      required: true,
      credentialEnv: 'ANTHROPIC_AUTH_TOKEN',
      emptyApiKey: true,
      derivedCredentialEnv: ['Z_AI_API_KEY'],
    },
    endpoint: { managed: true, defaultBaseUrl: 'https://api.z.ai/api/anthropic', editable: true },
    models: {
      policy: 'defaulted',
      aliases: ZAI_DEFAULT_MODELS,
      display: {
        opus: { name: 'GLM-5.1', description: 'Z.ai primary coding model' },
        sonnet: { name: 'GLM-5-Turbo', description: 'Z.ai balanced coding model' },
        haiku: { name: 'GLM-4.5-Air', description: 'Z.ai fast coding model' },
      },
      customModelOption: {
        model: ZAI_DEFAULT_MODELS.opus,
        name: 'GLM-5.1',
        description: 'Z.ai primary coding model',
      },
      startupAlias: 'opus',
      smallFastAlias: 'haiku',
      staleModels: ZAI_STALE_MODELS,
    },
    runtime: hostedRuntime(),
    features: {
      promptPack: { supported: true, defaultEnabled: true },
      browserSkill: { supported: true, defaultEnabled: false },
      shellEnv: { supported: true, defaultEnabled: false, exports: ['Z_AI_API_KEY'] },
      tweakcc: { defaultEnabled: true, profile: 'recommended' },
    },
    tools: { webMode: 'providerReplacement', deny: ZAI_DENY_TOOLS },
    claudeConfig: { onboarding: 'complete', approveCredential: true, mcpServers: [] },
  },
  minimax: {
    key: 'minimax',
    version: 1,
    providerClass: 'hostedAuthToken',
    auth: {
      mode: 'authToken',
      required: true,
      credentialEnv: 'ANTHROPIC_AUTH_TOKEN',
      emptyApiKey: true,
    },
    endpoint: { managed: true, defaultBaseUrl: 'https://api.minimax.io/anthropic', editable: true },
    models: {
      policy: 'defaulted',
      aliases: aliasesFromSingleModel(MINIMAX_DEFAULT_MODEL),
      display: displayFromSingleModel('MiniMax-M2.7', 'MiniMax coding model'),
      customModelOption: {
        model: MINIMAX_DEFAULT_MODEL,
        name: 'MiniMax-M2.7',
        description: 'MiniMax coding model',
      },
      startupAlias: 'sonnet',
      startupEnv: 'ANTHROPIC_MODEL',
      smallFastAlias: 'haiku',
      staleModels: MINIMAX_STALE_MODELS,
    },
    runtime: hostedRuntime(),
    features: {
      promptPack: { supported: true, defaultEnabled: true },
      browserSkill: { supported: true, defaultEnabled: false },
      shellEnv: { supported: false, defaultEnabled: false, exports: [] },
      tweakcc: { defaultEnabled: true, profile: 'recommended' },
    },
    tools: { webMode: 'providerReplacement', deny: MINIMAX_DENY_TOOLS },
    claudeConfig: { onboarding: 'complete', approveCredential: true, mcpServers: [MINIMAX_MCP_SERVER] },
  },
  kimi: {
    key: 'kimi',
    version: 1,
    providerClass: 'hostedAuthToken',
    auth: { mode: 'authToken', required: true, credentialEnv: 'ANTHROPIC_AUTH_TOKEN', emptyApiKey: true },
    endpoint: {
      managed: true,
      defaultBaseUrl: 'https://api.moonshot.ai/anthropic',
      staleBaseUrls: ['https://api.kimi.com/coding/'],
      editable: true,
    },
    models: {
      policy: 'defaulted',
      aliases: aliasesFromSingleModel(KIMI_DEFAULT_MODEL),
      display: displayFromSingleModel('Kimi K2.6', 'Moonshot Kimi coding model'),
      customModelOption: {
        model: KIMI_DEFAULT_MODEL,
        name: 'Kimi K2.6',
        description: 'Moonshot Kimi coding model',
      },
      startupAlias: 'sonnet',
      startupEnv: 'ANTHROPIC_MODEL',
      smallFastAlias: 'haiku',
      subagentModel: KIMI_DEFAULT_MODEL,
      staleModels: KIMI_STALE_MODELS,
    },
    runtime: hostedRuntime(),
    features: {
      promptPack: { supported: false, defaultEnabled: false },
      browserSkill: { supported: true, defaultEnabled: false },
      shellEnv: { supported: false, defaultEnabled: false, exports: [] },
      tweakcc: { defaultEnabled: true, profile: 'recommended' },
    },
    tools: { webMode: 'native', deny: [] },
    claudeConfig: { onboarding: 'complete', approveCredential: true, mcpServers: [] },
  },
  openrouter: {
    key: 'openrouter',
    version: 1,
    providerClass: 'hostedAuthToken',
    auth: { mode: 'authToken', required: true, credentialEnv: 'ANTHROPIC_AUTH_TOKEN', emptyApiKey: true },
    endpoint: { managed: true, defaultBaseUrl: 'https://openrouter.ai/api', editable: true },
    models: { policy: 'required', startupAlias: 'sonnet', smallFastAlias: 'haiku' },
    runtime: hostedRuntime(),
    features: {
      promptPack: { supported: false, defaultEnabled: false },
      browserSkill: { supported: true, defaultEnabled: false },
      shellEnv: { supported: false, defaultEnabled: false, exports: [] },
      tweakcc: { defaultEnabled: true, profile: 'recommended' },
    },
    tools: { webMode: 'native', deny: [] },
    claudeConfig: { onboarding: 'complete', approveCredential: true, mcpServers: [] },
  },
  ccrouter: {
    key: 'ccrouter',
    version: 1,
    providerClass: 'localRouter',
    auth: {
      mode: 'authToken',
      required: false,
      credentialEnv: 'ANTHROPIC_AUTH_TOKEN',
      emptyApiKey: true,
      fallbackToken: CCROUTER_AUTH_FALLBACK,
    },
    endpoint: { managed: true, defaultBaseUrl: 'http://127.0.0.1:3456', editable: true },
    models: { policy: 'external' },
    runtime: hostedRuntime(),
    features: {
      promptPack: { supported: false, defaultEnabled: false },
      browserSkill: { supported: true, defaultEnabled: false },
      shellEnv: { supported: false, defaultEnabled: false, exports: [] },
      tweakcc: { defaultEnabled: true, profile: 'recommended' },
    },
    tools: { webMode: 'external', deny: [] },
    claudeConfig: { onboarding: 'complete', approveCredential: true, mcpServers: [] },
  },
  ollama: {
    key: 'ollama',
    version: 1,
    providerClass: 'authTokenAlsoApiKey',
    auth: {
      mode: 'authToken',
      required: false,
      credentialEnv: 'ANTHROPIC_AUTH_TOKEN',
      authTokenAlsoSetsApiKey: true,
      fallbackToken: 'ollama',
    },
    endpoint: { managed: true, defaultBaseUrl: 'http://localhost:11434', editable: true },
    models: {
      policy: 'defaulted',
      aliases: aliasesFromSingleModel(OLLAMA_DEFAULT_MODEL),
      display: displayFromSingleModel('Ollama coding model', 'Local or Ollama cloud model'),
      customModelOption: {
        model: OLLAMA_DEFAULT_MODEL,
        name: 'Ollama coding model',
        description: 'Local or Ollama cloud model',
      },
      startupAlias: 'sonnet',
      smallFastAlias: 'haiku',
    },
    runtime: hostedRuntime(),
    features: {
      promptPack: { supported: false, defaultEnabled: false },
      browserSkill: { supported: true, defaultEnabled: false },
      shellEnv: { supported: false, defaultEnabled: false, exports: [] },
      tweakcc: { defaultEnabled: true, profile: 'recommended' },
    },
    tools: { webMode: 'native', deny: [] },
    claudeConfig: { onboarding: 'complete', approveCredential: true, mcpServers: [] },
  },
  gatewayz: {
    key: 'gatewayz',
    version: 1,
    providerClass: 'hostedAuthToken',
    auth: { mode: 'authToken', required: true, credentialEnv: 'ANTHROPIC_AUTH_TOKEN', emptyApiKey: true },
    endpoint: { managed: true, defaultBaseUrl: 'https://api.gatewayz.ai', editable: true },
    models: { policy: 'required', startupAlias: 'sonnet', smallFastAlias: 'haiku' },
    runtime: hostedRuntime(),
    features: {
      promptPack: { supported: false, defaultEnabled: false },
      browserSkill: { supported: true, defaultEnabled: false },
      shellEnv: { supported: false, defaultEnabled: false, exports: [] },
      tweakcc: { defaultEnabled: true, profile: 'recommended' },
    },
    tools: { webMode: 'native', deny: [] },
    claudeConfig: { onboarding: 'complete', approveCredential: true, mcpServers: [] },
  },
  vercel: {
    key: 'vercel',
    version: 1,
    providerClass: 'hostedAuthToken',
    auth: { mode: 'authToken', required: true, credentialEnv: 'ANTHROPIC_AUTH_TOKEN', emptyApiKey: true },
    endpoint: { managed: true, defaultBaseUrl: 'https://ai-gateway.vercel.sh', editable: true },
    models: { policy: 'required', startupAlias: 'sonnet', smallFastAlias: 'haiku' },
    runtime: hostedRuntime(),
    features: {
      promptPack: { supported: false, defaultEnabled: false },
      browserSkill: { supported: true, defaultEnabled: false },
      shellEnv: { supported: false, defaultEnabled: false, exports: [] },
      tweakcc: { defaultEnabled: true, profile: 'recommended' },
    },
    tools: { webMode: 'native', deny: [] },
    claudeConfig: { onboarding: 'complete', approveCredential: true, mcpServers: [] },
  },
  nanogpt: {
    key: 'nanogpt',
    version: 1,
    providerClass: 'hostedAuthToken',
    auth: { mode: 'authToken', required: true, credentialEnv: 'ANTHROPIC_AUTH_TOKEN', emptyApiKey: true },
    endpoint: {
      managed: true,
      defaultBaseUrl: 'https://nano-gpt.com/api/v1',
      staleBaseUrls: ['https://nano-gpt.com/api'],
      editable: true,
    },
    models: {
      policy: 'defaulted',
      aliases: NANOGPT_DEFAULT_MODELS,
      display: {
        opus: { name: 'GPT-5.2', description: 'NanoGPT primary coding model' },
        sonnet: { name: 'GPT-5.2', description: 'NanoGPT balanced coding model' },
        haiku: { name: 'Gemini 3 Flash', description: 'NanoGPT fast coding model' },
      },
      customModelOption: {
        model: NANOGPT_DEFAULT_MODELS.sonnet,
        name: 'GPT-5.2 via NanoGPT',
        description: 'NanoGPT coding model',
      },
      startupAlias: 'sonnet',
      smallFastAlias: 'haiku',
      staleModels: NANOGPT_STALE_MODELS,
    },
    runtime: hostedRuntime('600000'),
    features: {
      promptPack: { supported: false, defaultEnabled: false },
      browserSkill: { supported: true, defaultEnabled: false },
      shellEnv: { supported: false, defaultEnabled: false, exports: [] },
      tweakcc: { defaultEnabled: true, profile: 'recommended' },
    },
    tools: { webMode: 'native', deny: [] },
    claudeConfig: { onboarding: 'complete', approveCredential: true, mcpServers: [] },
  },
  custom: {
    key: 'custom',
    version: 1,
    providerClass: 'hostedApiKey',
    auth: { mode: 'apiKey', required: true, credentialEnv: 'ANTHROPIC_API_KEY', unsetAmbientAuthToken: true },
    endpoint: { managed: true, editable: true },
    models: { policy: 'required', startupAlias: 'sonnet', smallFastAlias: 'haiku' },
    runtime: hostedRuntime(),
    features: {
      promptPack: { supported: false, defaultEnabled: false },
      browserSkill: { supported: true, defaultEnabled: false },
      shellEnv: { supported: false, defaultEnabled: false, exports: [] },
      tweakcc: { defaultEnabled: true, profile: 'recommended' },
    },
    tools: { webMode: 'native', deny: [] },
    claudeConfig: { onboarding: 'complete', approveCredential: true, mcpServers: [] },
  },
};

export const getProviderCapability = (key: string): ProviderCapabilityProfile | undefined => PROVIDER_CAPABILITIES[key];

const normalizeValue = (value?: string) => (value ?? '').trim();

export const resolveModelAliases = (
  profile: ProviderCapabilityProfile,
  overrides?: ModelOverrides
): Partial<Record<ModelAlias, string>> => ({
  ...(profile.models.aliases ?? {}),
  ...(normalizeValue(overrides?.opus) ? { opus: normalizeValue(overrides?.opus) } : {}),
  ...(normalizeValue(overrides?.sonnet) ? { sonnet: normalizeValue(overrides?.sonnet) } : {}),
  ...(normalizeValue(overrides?.haiku) ? { haiku: normalizeValue(overrides?.haiku) } : {}),
});

export const resolveStartupModelSetting = (
  profile: ProviderCapabilityProfile,
  overrides?: ModelOverrides
): string | undefined => {
  const explicit = normalizeValue(overrides?.defaultModel);
  if (explicit) return explicit;
  if (!profile.models.startupAlias) return undefined;
  const aliases = resolveModelAliases(profile, overrides);
  return aliases[profile.models.startupAlias] || undefined;
};

export const resolveAvailableModelsSetting = (
  profile: ProviderCapabilityProfile,
  overrides?: ModelOverrides
): string[] | undefined => {
  if (profile.models.policy !== 'defaulted') return undefined;
  const aliases = resolveModelAliases(profile, overrides);
  const models = [aliases.opus, aliases.sonnet, aliases.haiku].map((value) => normalizeValue(value)).filter(Boolean);
  return models.length > 0 ? [...new Set(models)] : undefined;
};

export const buildManagedClaudeSettings = (
  profile: ProviderCapabilityProfile,
  overrides?: ModelOverrides
): ManagedClaudeSettings => {
  const availableModels = resolveAvailableModelsSetting(profile, overrides);
  return {
    companyAnnouncements: [],
    spinnerTipsEnabled: false,
    feedbackSurveyRate: 0,
    includeCoAuthoredBy: false,
    attribution: {
      commit: '',
      pr: '',
    },
    ...(availableModels ? { availableModels } : {}),
  };
};

export const buildCapabilityEnv = (opts: {
  profile: ProviderCapabilityProfile;
  baseEnv?: ProviderEnv;
  baseUrl?: string;
  apiKey?: string;
  extraEnv?: string[];
  modelOverrides?: ModelOverrides;
}): ProviderEnv => {
  const { profile } = opts;
  const env: ProviderEnv = { ...(opts.baseEnv ?? {}) };
  const credential = normalizeValue(opts.apiKey) || profile.auth.fallbackToken || '';

  if (profile.runtime.apiTimeoutMs && !Object.hasOwn(env, 'API_TIMEOUT_MS')) {
    env.API_TIMEOUT_MS = profile.runtime.apiTimeoutMs;
  }
  if (profile.runtime.updatePolicy === 'ccMirrorManaged') {
    env.DISABLE_UPDATES = '1';
    env.DISABLE_AUTOUPDATER = '1';
    env.DISABLE_UPGRADE_COMMAND = '1';
    env.DISABLE_LOGIN_COMMAND = '1';
    env.DISABLE_LOGOUT_COMMAND = '1';
  }
  if (profile.runtime.nonessentialTraffic === 'disable') {
    env.CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC = '1';
    env.DISABLE_TELEMETRY = '1';
    env.DISABLE_ERROR_REPORTING = '1';
    env.DISABLE_GROWTHBOOK = '1';
    env.DISABLE_BUG_COMMAND = '1';
    env.DISABLE_FEEDBACK_COMMAND = '1';
    env.ENABLE_CLAUDEAI_MCP_SERVERS = 'false';
    env.ENABLE_TOOL_SEARCH = 'false';
    env.CLAUDE_CODE_DISABLE_OFFICIAL_MARKETPLACE_AUTOINSTALL = '1';
    env.CLAUDE_CODE_ENABLE_GATEWAY_MODEL_DISCOVERY = '0';
  }

  const baseUrl = normalizeValue(opts.baseUrl) || profile.endpoint.defaultBaseUrl || '';
  if (profile.endpoint.managed && baseUrl) {
    env.ANTHROPIC_BASE_URL = baseUrl;
  }

  if (profile.auth.mode === 'apiKey') {
    if (credential) env.ANTHROPIC_API_KEY = credential;
    if (profile.auth.unsetAmbientAuthToken) env.CC_MIRROR_UNSET_AUTH_TOKEN = '1';
    delete env.ANTHROPIC_AUTH_TOKEN;
  } else if (profile.auth.mode === 'authToken') {
    delete env.CC_MIRROR_UNSET_AUTH_TOKEN;
    if (credential) {
      env.ANTHROPIC_AUTH_TOKEN = credential;
      for (const key of profile.auth.derivedCredentialEnv ?? []) {
        env[key] = credential;
      }
      if (profile.auth.authTokenAlsoSetsApiKey) {
        env.ANTHROPIC_API_KEY = credential;
      }
    }
    if (profile.auth.emptyApiKey) {
      env.ANTHROPIC_API_KEY = '';
    } else if (!profile.auth.authTokenAlsoSetsApiKey) {
      delete env.ANTHROPIC_API_KEY;
    }
  } else {
    delete env.ANTHROPIC_BASE_URL;
    delete env.ANTHROPIC_API_KEY;
    delete env.ANTHROPIC_AUTH_TOKEN;
    delete env.CC_MIRROR_UNSET_AUTH_TOKEN;
  }

  const aliases = resolveModelAliases(profile, opts.modelOverrides);
  if (aliases.opus) env.ANTHROPIC_DEFAULT_OPUS_MODEL = aliases.opus;
  if (aliases.sonnet) env.ANTHROPIC_DEFAULT_SONNET_MODEL = aliases.sonnet;
  if (aliases.haiku) env.ANTHROPIC_DEFAULT_HAIKU_MODEL = aliases.haiku;
  if (profile.models.startupEnv) {
    const startupModel = resolveStartupModelSetting(profile, opts.modelOverrides);
    if (startupModel) env[profile.models.startupEnv] = startupModel;
  }
  Object.assign(env, buildModelDisplayEnv(profile.models.display));
  Object.assign(env, buildCustomModelOptionEnv(profile.models.customModelOption));

  const smallFast = normalizeValue(opts.modelOverrides?.smallFast) || aliases[profile.models.smallFastAlias ?? 'haiku'];
  if (smallFast) env.ANTHROPIC_SMALL_FAST_MODEL = smallFast;

  const subagentModel = normalizeValue(opts.modelOverrides?.subagentModel) || profile.models.subagentModel || '';
  if (subagentModel) {
    env.CLAUDE_CODE_SUBAGENT_MODEL = subagentModel;
  }

  for (const entry of opts.extraEnv ?? []) {
    const idx = entry.indexOf('=');
    if (idx === -1) continue;
    const key = entry.slice(0, idx).trim();
    const value = entry.slice(idx + 1).trim();
    if (key) env[key] = value;
  }

  return env;
};

export const buildCapabilityMetadata = (opts: {
  profile: ProviderCapabilityProfile;
  baseUrl?: string;
  env?: ProviderEnv;
  promptPackEnabled: boolean;
  shellEnvEnabled: boolean;
  skillInstallEnabled: boolean;
}) => {
  const aliases = {
    opus: opts.env?.ANTHROPIC_DEFAULT_OPUS_MODEL,
    sonnet: opts.env?.ANTHROPIC_DEFAULT_SONNET_MODEL,
    haiku: opts.env?.ANTHROPIC_DEFAULT_HAIKU_MODEL,
  };
  const modelAliases = Object.fromEntries(
    Object.entries(aliases).filter(([, value]) => typeof value === 'string' && value.length > 0)
  ) as Partial<Record<ModelAlias, string>>;

  return {
    providerProfile: {
      key: opts.profile.key,
      version: opts.profile.version,
      fingerprint: `${opts.profile.key}:${opts.profile.version}`,
    },
    capabilities: {
      auth: {
        mode: opts.profile.auth.mode,
        required: opts.profile.auth.required,
        envKeys: [
          opts.profile.auth.credentialEnv,
          ...(opts.profile.auth.derivedCredentialEnv ?? []),
          opts.profile.auth.emptyApiKey ? 'ANTHROPIC_API_KEY' : undefined,
        ].filter(Boolean) as string[],
      },
      endpoint: {
        managed: opts.profile.endpoint.managed,
        baseUrl: opts.baseUrl || opts.profile.endpoint.defaultBaseUrl,
      },
      models: {
        policy: opts.profile.models.policy,
        aliases: modelAliases,
        display: opts.profile.models.display,
        startup: opts.profile.models.startupAlias ? modelAliases[opts.profile.models.startupAlias] : undefined,
        startupEnv: opts.profile.models.startupEnv,
        smallFast: opts.profile.models.smallFastAlias ? modelAliases[opts.profile.models.smallFastAlias] : undefined,
      },
      promptPack: {
        supported: opts.profile.features.promptPack.supported,
        enabled: opts.promptPackEnabled,
      },
      shellEnv: {
        supported: opts.profile.features.shellEnv.supported,
        enabled: opts.shellEnvEnabled,
        exports: opts.profile.features.shellEnv.exports,
      },
      skills: {
        browser: opts.skillInstallEnabled,
      },
      tools: {
        webMode: opts.profile.tools.webMode,
        denied: opts.profile.tools.deny,
      },
      mcp: {
        servers: opts.profile.claudeConfig.mcpServers.map((server) => server.id),
      },
      runtime: {
        updatePolicy: opts.profile.runtime.updatePolicy,
        nonessentialTraffic: opts.profile.runtime.nonessentialTraffic,
      },
      tweakcc: {
        enabled: opts.profile.features.tweakcc.defaultEnabled,
        profile: opts.profile.features.tweakcc.profile,
      },
    },
    managed: {
      settingsEnvKeys: getManagedSettingsEnvKeys(opts.profile),
      permissionsDeny: opts.profile.tools.deny,
      mcpServerIds: opts.profile.claudeConfig.mcpServers.map((server) => server.id),
    },
  };
};
