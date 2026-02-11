/**
 * Provider Education
 *
 * Detailed information about each provider for the education layer.
 */

export interface ProviderEducation {
  headline: string;
  tagline: string;
  features: string[];
  bestFor: string;
  models?: {
    opus?: string;
    sonnet?: string;
    haiku?: string;
  };
  requiresMapping: boolean;
  hasPromptPack: boolean;
  setupLinks?: {
    subscribe: string;
    apiKey: string;
    docs?: string;
    github?: string;
  };
  setupNote?: string; // Brief explanation of what this provider needs
}

export const PROVIDER_EDUCATION: Record<string, ProviderEducation> = {
  zai: {
    headline: 'GLM Coding Plan via Z.ai',
    tagline: 'Gold streams, powerful reasoning',
    features: [
      'GLM-5 for Opus (most capable) tasks',
      'GLM-4.7 for Sonnet (balanced) tasks',
      'GLM-4.5-Air for Haiku (fast) tasks',
      'Prompt pack with zai-cli routing',
      'Gold-themed interface',
    ],
    bestFor: "Heavy coding with GLM's reasoning capabilities",
    models: {
      opus: 'glm-5',
      sonnet: 'glm-4.7',
      haiku: 'glm-4.5-air',
    },
    requiresMapping: false,
    hasPromptPack: true,
    setupLinks: {
      subscribe: 'https://z.ai/subscribe',
      apiKey: 'https://z.ai/manage-apikey/apikey-list',
      docs: 'https://z.ai/docs',
    },
    setupNote: 'Subscribe to the Z.ai Coding Plan, then copy your API key from the dashboard.',
  },

  minimax: {
    headline: 'MiniMax-M2.1 — AGI for All',
    tagline: 'Coral pulses, unified model',
    features: [
      'Single model for all tiers',
      'Prompt pack with MCP tool routing',
      'MCP tools for web search & vision',
      'Coral-themed interface',
    ],
    bestFor: 'Streamlined experience with one powerful model',
    models: {
      opus: 'MiniMax-M2.1',
      sonnet: 'MiniMax-M2.1',
      haiku: 'MiniMax-M2.1',
    },
    requiresMapping: false,
    hasPromptPack: true,
    setupLinks: {
      subscribe: 'https://platform.minimax.io/subscribe/coding-plan',
      apiKey: 'https://platform.minimax.io/user-center/payment/coding-plan',
      docs: 'https://platform.minimax.io/docs',
    },
    setupNote: 'Subscribe to MiniMax Coding Plan, then get your API key from the payment page.',
  },

  kimi: {
    headline: 'Kimi Code — kimi-for-coding (K2.5)',
    tagline: 'Aurora context, crisp code',
    features: [
      'Anthropic-compatible endpoint',
      'kimi-for-coding model (powered by kimi-k2.5)',
      'Up to 262k context window',
      'Tab toggles Kimi K2 Thinking model in Claude Code',
      'Aurora-themed interface',
    ],
    bestFor: 'Long-context coding sessions via the Kimi Code plan',
    models: {
      opus: 'kimi-for-coding',
      sonnet: 'kimi-for-coding',
      haiku: 'kimi-for-coding',
    },
    requiresMapping: false,
    hasPromptPack: false,
    setupLinks: {
      subscribe: 'https://www.kimi.com/code',
      apiKey: 'https://www.kimi.com/code/console',
      docs: 'https://www.kimi.com/code/docs/en/more/third-party-agents.html',
    },
    setupNote:
      'Subscribe to Kimi Code, create an API key in the console, and set ANTHROPIC_BASE_URL to https://api.kimi.com/coding/.',
  },

  openrouter: {
    headline: 'OpenRouter — One API, Any Model',
    tagline: 'Many paths, one door',
    features: ['Access to 100+ models', 'Pay-per-use pricing', 'Model flexibility', 'Teal-themed interface'],
    bestFor: 'Trying different models without multiple accounts',
    requiresMapping: true,
    hasPromptPack: false,
    setupLinks: {
      subscribe: 'https://openrouter.ai/account',
      apiKey: 'https://openrouter.ai/keys',
      docs: 'https://openrouter.ai/docs',
    },
    setupNote: 'Create an account, add credits, then generate an API key. You must set model aliases.',
  },

  ccrouter: {
    headline: 'Claude Code Router — Local Model Gateway',
    tagline: 'Your models, your rules',
    features: [
      'Route to local LLMs (Ollama, LM Studio) or cloud APIs',
      'Supports DeepSeek, Gemini, OpenRouter, and more',
      'Automatic routing: background tasks, reasoning, long context',
      'Models configured in ~/.claude-code-router/config.json',
    ],
    bestFor: 'Local-first development with custom model routing',
    requiresMapping: false,
    hasPromptPack: false,
    setupLinks: {
      subscribe: 'https://github.com/musistudio/claude-code-router#installation',
      apiKey: 'https://github.com/musistudio/claude-code-router#2-configuration',
      github: 'https://github.com/musistudio/claude-code-router',
      docs: 'https://github.com/musistudio/claude-code-router#2-configuration',
    },
    setupNote:
      'Install: npm i -g @musistudio/claude-code-router, run "ccr start". Configure models in ~/.claude-code-router/config.json',
  },
  ollama: {
    headline: 'Ollama — Local + Cloud Models',
    tagline: 'Warm, local-first models',
    features: [
      'Run local models with the Ollama runtime',
      'Cloud models available via ollama.com',
      'Alias models for clean mappings',
      'Ember-themed interface',
    ],
    bestFor: 'Local-first workstations and hybrid local/cloud setups',
    models: {
      opus: 'glm-4.7:cloud',
      sonnet: 'qwen3-coder',
      haiku: 'gpt-oss:20b',
    },
    requiresMapping: true,
    hasPromptPack: false,
    setupLinks: {
      subscribe: 'https://ollama.com',
      apiKey: 'https://ollama.com',
      docs: 'https://docs.ollama.com/api/anthropic-compatibility',
    },
    setupNote:
      'Local: set key to "ollama" (values ignored). Cloud: set base URL to https://ollama.com and use your API key.',
  },
  gatewayz: {
    headline: 'GatewayZ — AI Gateway',
    tagline: 'One gateway, many providers',
    features: [
      'Claude Code endpoint support',
      'Single API key for multiple providers',
      'Gateway-style routing',
      'Violet-themed interface',
    ],
    bestFor: 'Routing multiple model providers through a single endpoint',
    requiresMapping: true,
    hasPromptPack: false,
    setupLinks: {
      subscribe: 'https://gatewayz.ai',
      apiKey: 'https://gatewayz.ai',
      docs: 'https://docs.gatewayz.ai/docs/anthropic-compatibility',
    },
    setupNote: 'GatewayZ uses Claude Code endpoints. Configure model mapping for your preferred models.',
  },
  vercel: {
    headline: 'Vercel AI Gateway',
    tagline: 'Unified AI routing on Vercel',
    features: [
      'Claude Code endpoint support',
      'Use provider/model identifiers',
      'Centralized usage + billing',
      'Monochrome + green accents',
    ],
    bestFor: 'Teams already using Vercel AI Gateway',
    requiresMapping: true,
    hasPromptPack: false,
    setupLinks: {
      subscribe: 'https://vercel.com/ai',
      apiKey: 'https://vercel.com/account/tokens',
      docs: 'https://vercel.com/docs/ai-gateway',
    },
    setupNote: 'Set ANTHROPIC_AUTH_TOKEN and keep ANTHROPIC_API_KEY empty.',
  },
  nanogpt: {
    headline: 'NanoGPT',
    tagline: 'Lean gateway, fast setup',
    features: ['Claude Code endpoint support', 'Simple API key auth', 'Neon-themed interface'],
    bestFor: 'Simple Claude Code usage with minimal setup',
    requiresMapping: false,
    hasPromptPack: false,
    setupLinks: {
      subscribe: 'https://nano-gpt.com',
      apiKey: 'https://nano-gpt.com',
      docs: 'https://docs.nano-gpt.com/docs/anthropic-compatibility',
    },
    setupNote: 'Use the NanoGPT base URL and API key to authenticate.',
  },
  mirror: {
    headline: 'The Fastest Path to Claude Code',
    tagline: 'Claude Code, Unshackled',
    features: [
      'Pure Claude — no proxy, no model changes',
      'Isolated config for experimentation',
      'Premium silver/chrome theme',
    ],
    bestFor: 'Power users who want a clean, isolated Claude Code setup',
    requiresMapping: false,
    hasPromptPack: false,
    setupLinks: {
      subscribe: 'https://console.anthropic.com/settings/plans',
      apiKey: 'https://console.anthropic.com/settings/keys',
      docs: 'https://github.com/numman-ali/cc-mirror/blob/main/docs/features/mirror-claude.md',
    },
    setupNote: 'Uses normal Claude authentication. Sign in via OAuth or set ANTHROPIC_API_KEY.',
  },
};

/**
 * Get education for a provider, with fallback
 */
export const getProviderEducation = (providerKey: string): ProviderEducation | null => {
  return PROVIDER_EDUCATION[providerKey] || null;
};

/**
 * Quick comparison points for provider selection
 */
export const PROVIDER_COMPARISON = {
  fullySupported: [
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
  ],
  requiresMapping: ['openrouter', 'ollama', 'gatewayz', 'vercel'],
  hasPromptPack: ['zai', 'minimax'],
  localFirst: ['ccrouter', 'ollama'],
  pureClaudeCode: ['mirror'],
  recommended: ['mirror'],
};
