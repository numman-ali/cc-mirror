/**
 * Model override utilities for CLI
 */

import { getProvider } from '../../providers/index.js';
import type { ModelOverrides } from '../../providers/index.js';
import type { ParsedArgs } from '../args.js';
import { requirePrompt } from './requirePrompt.js';

/**
 * Extract model overrides from parsed CLI arguments
 */
export function getModelOverridesFromArgs(opts: ParsedArgs): ModelOverrides {
  return {
    sonnet: typeof opts['model-sonnet'] === 'string' ? (opts['model-sonnet'] as string) : undefined,
    opus: typeof opts['model-opus'] === 'string' ? (opts['model-opus'] as string) : undefined,
    haiku: typeof opts['model-haiku'] === 'string' ? (opts['model-haiku'] as string) : undefined,
    smallFast: typeof opts['model-small-fast'] === 'string' ? (opts['model-small-fast'] as string) : undefined,
    defaultModel: typeof opts['model-default'] === 'string' ? (opts['model-default'] as string) : undefined,
    subagentModel: typeof opts['model-subagent'] === 'string' ? (opts['model-subagent'] as string) : undefined,
  };
}

/** Default model mappings for providers that have known defaults */
const PROVIDER_MODEL_DEFAULTS: Record<string, { sonnet: string; opus: string; haiku: string }> = {
  gatewayz: {
    sonnet: 'claude-sonnet-4-20250514',
    opus: 'claude-opus-4-5-20251101',
    haiku: 'claude-haiku-3-5-20241022',
  },
};

/**
 * Ensure model mapping for providers that require it (e.g., OpenRouter, LiteLLM)
 * Prompts for missing models if not in --yes mode
 */
export async function ensureModelMapping(
  providerKey: string,
  opts: ParsedArgs,
  overrides: ModelOverrides
): Promise<ModelOverrides> {
  const provider = getProvider(providerKey);
  if (!provider?.requiresModelMapping) return overrides;

  // Apply provider-specific defaults if available
  const defaults = PROVIDER_MODEL_DEFAULTS[providerKey];
  if (defaults) {
    if (!overrides.sonnet?.trim()) overrides.sonnet = defaults.sonnet;
    if (!overrides.opus?.trim()) overrides.opus = defaults.opus;
    if (!overrides.haiku?.trim()) overrides.haiku = defaults.haiku;
  }

  const missing = {
    sonnet: (overrides.sonnet ?? '').trim().length === 0,
    opus: (overrides.opus ?? '').trim().length === 0,
    haiku: (overrides.haiku ?? '').trim().length === 0,
  };
  if (opts.yes && (missing.sonnet || missing.opus || missing.haiku)) {
    throw new Error('OpenRouter/Local LLMs require --model-sonnet/--model-opus/--model-haiku');
  }
  if (!opts.yes) {
    if (missing.sonnet) overrides.sonnet = await requirePrompt('Default Sonnet model', overrides.sonnet);
    if (missing.opus) overrides.opus = await requirePrompt('Default Opus model', overrides.opus);
    if (missing.haiku) overrides.haiku = await requirePrompt('Default Haiku model', overrides.haiku);
  }
  return overrides;
}

/**
 * Format model overrides as a note string for display
 */
export function formatModelNote(overrides: ModelOverrides): string | null {
  const entries = [
    ['sonnet', overrides.sonnet],
    ['opus', overrides.opus],
    ['haiku', overrides.haiku],
  ].filter(([, value]) => value && String(value).trim().length > 0) as Array<[string, string]>;
  if (entries.length === 0) return null;
  const text = entries.map(([key, value]) => `${key}=${value}`).join(', ');
  return `Model mapping: ${text}`;
}
