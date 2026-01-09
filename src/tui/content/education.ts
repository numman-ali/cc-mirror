/**
 * Educational Content
 *
 * Conceptual explanations for users who want to understand
 * what CC-MIRROR does and how it works under the hood.
 */

import path from 'node:path';
import { DEFAULT_BIN_DIR, DEFAULT_ROOT } from '../../core/constants.js';
import { getWrapperPath } from '../../core/paths.js';

const ROOT_HINT = path.join(DEFAULT_ROOT, '<name>');
const WRAPPER_HINT = getWrapperPath(DEFAULT_BIN_DIR, '<name>');

export const EDUCATION = {
  whatIsCcMirror: {
    title: 'What is CC-MIRROR?',
    brief: 'Create isolated Claude Code variants with custom providers.',
    detailed: [
      'CC-MIRROR creates isolated Claude Code installations that connect to',
      'different AI providers. Each variant has its own configuration, theme,',
      'and settings—completely independent from your main Claude Code.',
      '',
      'Think of it as having multiple Claude Code "accounts", each pointing',
      'to a different AI backend: Z.ai, MiniMax, OpenRouter, or your own.',
    ],
  },

  whyVariants: {
    title: 'Why Variants?',
    brief: 'Keep different AI providers separate and organized.',
    points: [
      'Run Z.ai GLM-4.7 and MiniMax-M2.1 side-by-side',
      'Experiment with OpenRouter without affecting your main setup',
      'Keep work projects separate from personal experimentation',
      'Try new models without risk—just create a new variant',
      'Each variant has isolated config, history, and MCP servers',
    ],
  },

  whatHappens: {
    title: 'What Happens During Setup?',
    brief: 'Four steps to a working variant.',
    steps: [
      {
        step: 1,
        title: 'Creates isolated directory',
        detail: `${ROOT_HINT} with its own config and data`,
      },
      {
        step: 2,
        title: 'Installs Claude Code',
        detail: 'Fresh npm install in the variant directory',
      },
      {
        step: 3,
        title: 'Generates wrapper script',
        detail: `${WRAPPER_HINT} pointing to your provider`,
      },
      {
        step: 4,
        title: 'Applies theming (optional)',
        detail: 'tweakcc patches for provider-specific look & feel',
      },
    ],
  },

  modelAliases: {
    title: 'What are Model Aliases?',
    brief: 'Claude Code uses 3 internal model tiers.',
    explanation: [
      'Claude Code internally uses three model aliases:',
      '',
      '  Opus   → Complex reasoning, architecture, long tasks',
      '  Sonnet → Default for most coding tasks',
      '  Haiku  → Quick tasks, subagents, fast iteration',
      '',
      'When using providers like OpenRouter or LiteLLM, you map',
      'these aliases to actual model names (e.g., claude-3-opus).',
    ],
  },

  isolation: {
    title: 'How Isolation Works',
    brief: 'Each variant is completely separate.',
    details: [
      'Every variant gets its own:',
      '',
      '  • CLAUDE_CONFIG_DIR  → settings, MCP servers, OAuth',
      '  • TWEAKCC_CONFIG_DIR → theme customizations',
      '  • npm installation   → Claude Code binary',
      '  • API credentials    → stored in settings.json',
      '',
      'Running `zai` vs `minimax` uses completely different',
      'configurations—they never interfere with each other.',
    ],
  },
};

/**
 * Quick tips shown contextually
 */
export const QUICK_TIPS = {
  apiKey: 'Your API key is stored locally in the variant config. Never sent anywhere except your chosen provider.',
  modelMapping: "Not sure which models? Check your provider's documentation for available model names.",
  promptPack: 'Prompt packs add provider-specific guidance to help Claude Code work better with your AI.',
  skillInstall: 'The dev-browser skill adds browser automation capabilities to your variant.',
};
