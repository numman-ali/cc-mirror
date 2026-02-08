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
  const overrides: ModelOverrides = {};

  // Convenience: set the 3 main tiers at once.
  if (typeof opts.model === 'string') {
    const value = opts.model.trim();
    if (value) {
      overrides.sonnet = value;
      overrides.opus = value;
      overrides.haiku = value;
    }
  }

  // Explicit tier flags override --model when provided.
  if (typeof opts['model-sonnet'] === 'string') overrides.sonnet = (opts['model-sonnet'] as string).trim();
  if (typeof opts['model-opus'] === 'string') overrides.opus = (opts['model-opus'] as string).trim();
  if (typeof opts['model-haiku'] === 'string') overrides.haiku = (opts['model-haiku'] as string).trim();
  if (typeof opts['model-small-fast'] === 'string') overrides.smallFast = (opts['model-small-fast'] as string).trim();
  if (typeof opts['model-default'] === 'string') overrides.defaultModel = (opts['model-default'] as string).trim();
  if (typeof opts['model-subagent'] === 'string') overrides.subagentModel = (opts['model-subagent'] as string).trim();

  // Avoid writing empty-string overrides into settings.json.
  for (const key of Object.keys(overrides) as Array<keyof ModelOverrides>) {
    const value = overrides[key];
    if (typeof value === 'string' && value.trim().length === 0) {
      delete overrides[key];
    }
  }

  return overrides;
}

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
  const missing = {
    sonnet: (overrides.sonnet ?? '').trim().length === 0,
    opus: (overrides.opus ?? '').trim().length === 0,
    haiku: (overrides.haiku ?? '').trim().length === 0,
  };
  if (opts.yes && (missing.sonnet || missing.opus || missing.haiku)) {
    throw new Error(
      'This provider requires --model-sonnet/--model-opus/--model-haiku (OpenRouter, GatewayZ, Vercel AI Gateway, Ollama).'
    );
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
