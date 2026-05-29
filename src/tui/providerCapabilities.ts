import {
  getProviderCapability,
  resolveModelAliases,
  type ProviderAuthMode,
  type ProviderTemplate,
} from '../providers/index.js';

export type ModelTier = 'opus' | 'sonnet' | 'haiku';
export type ModelAliasMap = Partial<Record<ModelTier, string>>;
export type EndpointKind = 'base-url' | 'router-url' | 'none';
export type ModelGuidanceKind = 'openrouter' | 'nanogpt' | 'ollama' | 'gateway' | 'generic';

type BooleanOrConfig<T> = boolean | T;

interface FutureProviderCapabilityContract {
  credential?: {
    required?: boolean;
    optional?: boolean;
    envVar?: string;
    detectEnvVars?: string[];
    skipPromptWhenDetectedFrom?: string[];
  };
  endpoint?: {
    kind?: EndpointKind;
    required?: boolean;
    configurable?: boolean;
  };
  models?: BooleanOrConfig<{
    required?: boolean;
    showInSetup?: boolean;
    prefillDefaults?: boolean;
    defaults?: ModelAliasMap;
    guidance?: ModelGuidanceKind;
  }>;
  promptPack?: BooleanOrConfig<{
    defaultEnabled?: boolean;
    routingLabel?: string;
  }>;
  skillInstall?: BooleanOrConfig<{
    defaultEnabled?: boolean;
  }>;
  shellEnv?: BooleanOrConfig<{
    defaultEnabled?: boolean;
    configurable?: boolean;
    envVar?: string;
  }>;
  defaultVariantName?: string;
}

type ProviderWithCapabilities = ProviderTemplate & {
  capabilities?: FutureProviderCapabilityContract;
};

export interface TuiProviderCapabilities {
  providerKey: string;
  defaultVariantName: string;
  credential: {
    required: boolean;
    envVar: 'ANTHROPIC_API_KEY' | 'ANTHROPIC_AUTH_TOKEN';
    detectEnvVars: string[];
    skipPromptWhenDetectedFrom: string[];
  };
  endpoint: {
    kind: EndpointKind;
    required: boolean;
    configurable: boolean;
  };
  models: {
    required: boolean;
    showInSetup: boolean;
    prefillDefaults: boolean;
    defaults: ModelAliasMap;
    guidance: ModelGuidanceKind;
  };
  promptPack: {
    defaultEnabled: boolean;
    routingLabel?: string;
  };
  skillInstall: {
    defaultEnabled: boolean;
  };
  shellEnv: {
    defaultEnabled: boolean;
    configurable: boolean;
    envVar: string;
  };
}

export interface CredentialDefaults {
  value: string;
  detectedFrom: string | null;
  skipPrompt: boolean;
}

const FALLBACK_MODEL_DEFAULTS: Record<string, ModelAliasMap> = {
  zai: {
    opus: 'glm-5.1',
    sonnet: 'glm-5-turbo',
    haiku: 'glm-4.5-air',
  },
  minimax: {
    opus: 'MiniMax-M2.7',
    sonnet: 'MiniMax-M2.7',
    haiku: 'MiniMax-M2.7',
  },
  ollama: {
    opus: 'qwen3.5',
    sonnet: 'qwen3.5',
    haiku: 'qwen3.5',
  },
  nanogpt: {
    opus: 'openai/gpt-5.2',
    sonnet: 'openai/gpt-5.2',
    haiku: 'google/gemini-3-flash-preview',
  },
};

const ROUTED_PROMPT_PACK_LABELS: Record<string, string> = {
  zai: 'zai-cli routing',
  minimax: 'MCP routing',
};

const MODEL_GUIDANCE_BY_PROVIDER: Record<string, ModelGuidanceKind> = {
  openrouter: 'openrouter',
  nanogpt: 'nanogpt',
  ollama: 'ollama',
  gatewayz: 'gateway',
  vercel: 'gateway',
};

const isConfig = <T extends object>(value: BooleanOrConfig<T> | undefined): value is T =>
  typeof value === 'object' && value !== null;

const readBoolCapability = <T extends object>(
  value: BooleanOrConfig<T> | undefined,
  key: keyof T,
  fallback: boolean
) => {
  if (typeof value === 'boolean') return value;
  if (isConfig(value) && typeof value[key] === 'boolean') return Boolean(value[key]);
  return fallback;
};

const readStringCapability = <T extends object>(
  value: BooleanOrConfig<T> | undefined,
  key: keyof T,
  fallback?: string
) => {
  if (isConfig(value) && typeof value[key] === 'string') return String(value[key]);
  return fallback;
};

const uniqueStrings = (values: Array<string | undefined>): string[] => [...new Set(values.filter(Boolean) as string[])];

const authEnvVar = (authMode?: ProviderAuthMode): 'ANTHROPIC_API_KEY' | 'ANTHROPIC_AUTH_TOKEN' =>
  authMode === 'authToken' ? 'ANTHROPIC_AUTH_TOKEN' : 'ANTHROPIC_API_KEY';

const envModelDefaults = (provider?: ProviderTemplate): ModelAliasMap => {
  const read = (key: string) => {
    const value = provider?.env?.[key];
    if (typeof value === 'string' || typeof value === 'number') return String(value).trim();
    return '';
  };

  return {
    opus: read('ANTHROPIC_DEFAULT_OPUS_MODEL') || undefined,
    sonnet: read('ANTHROPIC_DEFAULT_SONNET_MODEL') || undefined,
    haiku: read('ANTHROPIC_DEFAULT_HAIKU_MODEL') || undefined,
  };
};

const mergeDefaults = (providerKey: string, provider?: ProviderTemplate, contractDefaults?: ModelAliasMap) => ({
  ...FALLBACK_MODEL_DEFAULTS[providerKey],
  ...envModelDefaults(provider),
  ...contractDefaults,
});

export const getModelGuidanceKind = (providerKey?: string): ModelGuidanceKind =>
  MODEL_GUIDANCE_BY_PROVIDER[providerKey || ''] || 'generic';

export const getTuiProviderCapabilities = (
  providerKey: string,
  provider?: ProviderWithCapabilities | null
): TuiProviderCapabilities => {
  const contract = provider?.capabilities;
  const profile = getProviderCapability(providerKey);
  const authMode = profile?.auth.mode ?? provider?.authMode ?? 'apiKey';
  const contractModelDefaults = isConfig(contract?.models) ? contract.models.defaults : undefined;

  const fallbackEndpointKind: EndpointKind =
    providerKey === 'ccrouter' ? 'router-url' : authMode === 'none' ? 'none' : 'base-url';
  const endpointKind = contract?.endpoint?.kind ?? fallbackEndpointKind;
  const credentialOptional = Boolean(provider?.credentialOptional);
  const credentialRequired =
    contract?.credential?.required ?? profile?.auth.required ?? !(authMode === 'none' || credentialOptional);
  const modelDefaults = {
    ...mergeDefaults(providerKey, provider ?? undefined, contractModelDefaults),
    ...(profile ? resolveModelAliases(profile) : {}),
  };
  const modelPolicy = profile?.models.policy;
  const fallbackShowsModels = modelPolicy === 'required' || (!profile && Boolean(provider?.requiresModelMapping));
  const fallbackPrefillModels = false;
  const fallbackPromptPack =
    profile?.features.promptPack.defaultEnabled ??
    (!provider?.noPromptPack && (providerKey === 'zai' || providerKey === 'minimax'));
  const fallbackSkillInstall = profile?.features.browserSkill.defaultEnabled ?? false;
  const fallbackShellEnv = profile?.features.shellEnv.defaultEnabled ?? providerKey === 'zai';
  const fallbackShellEnvConfigurable = profile?.features.shellEnv.supported ?? providerKey === 'zai';
  const fallbackShellEnvVar =
    profile?.features.shellEnv.exports[0] ?? (providerKey === 'zai' ? 'Z_AI_API_KEY' : 'ANTHROPIC_API_KEY');
  const detectEnvVars =
    contract?.credential?.detectEnvVars ??
    uniqueStrings([
      ...(profile?.auth.derivedCredentialEnv ?? []),
      profile?.auth.credentialEnv,
      ...(providerKey === 'zai' ? ['ANTHROPIC_AUTH_TOKEN', 'ANTHROPIC_API_KEY'] : []),
    ]);
  const skipPromptWhenDetectedFrom =
    contract?.credential?.skipPromptWhenDetectedFrom ??
    (profile?.auth.derivedCredentialEnv?.includes('Z_AI_API_KEY') ? ['Z_AI_API_KEY'] : []);

  return {
    providerKey,
    defaultVariantName:
      contract?.defaultVariantName ||
      provider?.defaultVariantName ||
      (providerKey === 'mirror' ? 'mirror' : providerKey),
    credential: {
      required: contract?.credential?.optional === true ? false : credentialRequired,
      envVar:
        (contract?.credential?.envVar as 'ANTHROPIC_API_KEY' | 'ANTHROPIC_AUTH_TOKEN' | undefined) ??
        authEnvVar(authMode),
      detectEnvVars,
      skipPromptWhenDetectedFrom,
    },
    endpoint: {
      kind: endpointKind,
      required: contract?.endpoint?.required ?? endpointKind === 'router-url',
      configurable: contract?.endpoint?.configurable ?? endpointKind !== 'none',
    },
    models: {
      required: readBoolCapability(
        contract?.models,
        'required',
        modelPolicy === 'required' || Boolean(provider?.requiresModelMapping && !profile)
      ),
      showInSetup: readBoolCapability(contract?.models, 'showInSetup', fallbackShowsModels),
      prefillDefaults: readBoolCapability(contract?.models, 'prefillDefaults', fallbackPrefillModels),
      defaults: modelDefaults,
      guidance:
        isConfig(contract?.models) && contract.models.guidance
          ? contract.models.guidance
          : getModelGuidanceKind(providerKey),
    },
    promptPack: {
      defaultEnabled: readBoolCapability(contract?.promptPack, 'defaultEnabled', fallbackPromptPack),
      routingLabel: readStringCapability(contract?.promptPack, 'routingLabel', ROUTED_PROMPT_PACK_LABELS[providerKey]),
    },
    skillInstall: {
      defaultEnabled: readBoolCapability(contract?.skillInstall, 'defaultEnabled', fallbackSkillInstall),
    },
    shellEnv: {
      defaultEnabled: readBoolCapability(contract?.shellEnv, 'defaultEnabled', fallbackShellEnv),
      configurable: readBoolCapability(contract?.shellEnv, 'configurable', fallbackShellEnvConfigurable),
      envVar: readStringCapability(contract?.shellEnv, 'envVar', fallbackShellEnvVar) || 'ANTHROPIC_API_KEY',
    },
  };
};

export const resolveCredentialDefaults = (
  capabilities: TuiProviderCapabilities,
  env: NodeJS.ProcessEnv = process.env
): CredentialDefaults => {
  for (const envVar of capabilities.credential.detectEnvVars) {
    const value = env[envVar]?.trim();
    if (value) {
      return {
        value,
        detectedFrom: envVar,
        skipPrompt: capabilities.credential.skipPromptWhenDetectedFrom.includes(envVar),
      };
    }
  }

  return { value: '', detectedFrom: null, skipPrompt: false };
};

export const shouldPromptForCredential = (
  capabilities: TuiProviderCapabilities,
  detectedFrom?: string | null
): boolean => {
  if (!capabilities.credential.required) return false;
  if (detectedFrom && capabilities.credential.skipPromptWhenDetectedFrom.includes(detectedFrom)) return false;
  return true;
};

export const shouldShowModelSetup = (capabilities: TuiProviderCapabilities): boolean => capabilities.models.showInSetup;

export const describePromptPack = (enabled: boolean, capabilities: Pick<TuiProviderCapabilities, 'promptPack'>) => {
  if (!enabled) return 'off';
  return capabilities.promptPack.routingLabel ? `on (${capabilities.promptPack.routingLabel})` : 'on';
};

export const describeShellEnv = (enabled: boolean, capabilities: Pick<TuiProviderCapabilities, 'shellEnv'>) =>
  enabled ? `write ${capabilities.shellEnv.envVar}` : 'manual';
