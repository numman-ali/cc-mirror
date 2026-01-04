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
      'GLM-4.7 for Sonnet/Opus tasks',
      'GLM-4.5-Air for Haiku (fast) tasks',
      'Full prompt pack support',
      'Gold-themed interface',
      'Shell environment integration',
    ],
    bestFor: "Heavy coding with GLM's reasoning capabilities",
    models: {
      opus: 'glm-4.7',
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
      'Full prompt pack support',
      'MCP tools for web & vision',
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
  mirror: {
    headline: 'Mirror Claude — Pure Claude Code, Enhanced',
    tagline: 'Reflections of perfection',
    features: [
      'Pure Claude Code experience (no proxy)',
      'Team mode enabled by default',
      'Isolated config for experimentation',
      'Premium silver/chrome theme',
      'No API key required at setup',
    ],
    bestFor: 'Power users who want enhanced Claude Code without changing the AI',
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
  fullySupported: ['zai', 'minimax'],
  requiresMapping: ['openrouter', 'ccrouter'],
  hasPromptPack: ['zai', 'minimax'],
  localFirst: ['ccrouter'],
  pureClaudeCode: ['mirror'],
  teamModeDefault: ['mirror'],
};
