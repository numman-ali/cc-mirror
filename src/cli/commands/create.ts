/**
 * Create command - creates a new variant
 */

import { listProviders, getProvider, type ProviderTemplate } from '../../providers/index.js';
import { listBrandPresets } from '../../brands/index.js';
import * as core from '../../core/index.js';
import type { ParsedArgs } from '../args.js';
import { prompt } from '../prompt.js';
import {
  printSummary,
  getModelOverridesFromArgs,
  ensureModelMapping,
  formatModelNote,
  requirePrompt,
  buildExtraEnv,
} from '../utils/index.js';

export interface CreateCommandOptions {
  opts: ParsedArgs;
  quickMode: boolean;
}

interface CreateParams {
  provider: ProviderTemplate;
  providerKey: string;
  name: string;
  baseUrl: string;
  apiKey: string;
  brand: string;
  rootDir: string;
  binDir: string;
  npmPackage: string;
  extraEnv: string[];
  requiresCredential: boolean;
  shouldPromptApiKey: boolean;
  hasZaiEnv: boolean;
}

/**
 * Prepare common parameters for create command
 */
async function prepareCreateParams(opts: ParsedArgs): Promise<CreateParams> {
  let providerKey = opts.provider as string | undefined;
  if (!providerKey && !opts.yes) {
    const providers = listProviders()
      .map((p) => p.key)
      .join(', ');
    providerKey = await prompt(`Provider (${providers})`, 'zai');
  }
  providerKey = providerKey || 'zai';

  const provider = getProvider(providerKey);
  if (!provider) {
    throw new Error(`Unknown provider: ${providerKey}`);
  }

  const name = (opts.name as string) || providerKey;
  const baseUrl = (opts['base-url'] as string) || provider.baseUrl;
  const envZaiKey = providerKey === 'zai' ? process.env.Z_AI_API_KEY : undefined;
  const envAnthropicKey = providerKey === 'zai' ? process.env.ANTHROPIC_API_KEY : undefined;
  const hasApiKeyFlag = Boolean(opts['api-key']);
  const hasZaiEnv = Boolean(envZaiKey);
  const apiKeyDetected = !hasApiKeyFlag && hasZaiEnv;
  const apiKey = (opts['api-key'] as string) || (providerKey === 'zai' ? envZaiKey || envAnthropicKey || '' : '');

  if (apiKeyDetected && !opts.yes) {
    console.log('Detected Z_AI_API_KEY in environment. Using it by default.');
  }

  const brand = (opts.brand as string) || 'auto';
  const rootDir = (opts.root as string) || core.DEFAULT_ROOT;
  const binDir = (opts['bin-dir'] as string) || core.DEFAULT_BIN_DIR;
  const npmPackage = (opts['npm-package'] as string) || core.DEFAULT_NPM_PACKAGE;
  const extraEnv = buildExtraEnv(opts);
  const requiresCredential = !provider.credentialOptional;
  // Don't prompt for API key if credential is optional (mirror, ccrouter)
  const shouldPromptApiKey =
    !provider.credentialOptional && !opts.yes && !hasApiKeyFlag && (providerKey === 'zai' ? !hasZaiEnv : !apiKey);

  return {
    provider,
    providerKey,
    name,
    baseUrl,
    apiKey,
    brand,
    rootDir,
    binDir,
    npmPackage,
    extraEnv,
    requiresCredential,
    shouldPromptApiKey,
    hasZaiEnv,
  };
}

/**
 * Handle quick mode creation (simplified prompts)
 */
async function handleQuickMode(opts: ParsedArgs, params: CreateParams): Promise<void> {
  const { provider } = params;
  const promptPack = opts['no-prompt-pack'] ? false : undefined;
  const skillInstall = opts['no-skill-install'] ? false : undefined;
  const skillUpdate = Boolean(opts['skill-update']);
  let shellEnv = opts['no-shell-env'] ? false : opts['shell-env'] ? true : undefined;
  const modelOverrides = getModelOverridesFromArgs(opts);

  let apiKey = params.apiKey;
  if (params.shouldPromptApiKey) {
    apiKey = params.requiresCredential
      ? await requirePrompt(provider.apiKeyLabel || 'ANTHROPIC_API_KEY', apiKey)
      : await prompt(provider.apiKeyLabel || 'ANTHROPIC_API_KEY', apiKey);
  }
  if (params.requiresCredential && !apiKey) {
    if (opts.yes) {
      throw new Error('Provider API key required (use --api-key)');
    }
    apiKey = await requirePrompt(provider.apiKeyLabel || 'ANTHROPIC_API_KEY', apiKey);
  }

  const resolvedModelOverrides = await ensureModelMapping(params.providerKey, opts, { ...modelOverrides });

  if (params.providerKey === 'zai' && shellEnv === undefined && !opts.yes) {
    if (params.hasZaiEnv) {
      shellEnv = false;
    } else {
      const answer = await prompt('Write Z_AI_API_KEY to your shell profile? (yes/no)', 'yes');
      shellEnv = answer.trim().toLowerCase().startsWith('y');
    }
  }

  // Team mode is disabled in current builds (guarded by TEAM_MODE_SUPPORTED)
  const enableTeamMode = core.TEAM_MODE_SUPPORTED ? (opts['disable-team-mode'] ? false : true) : false;

  const result = core.createVariant({
    name: params.name,
    providerKey: params.providerKey,
    baseUrl: params.baseUrl,
    apiKey,
    brand: params.brand,
    extraEnv: params.extraEnv,
    rootDir: params.rootDir,
    binDir: params.binDir,
    npmPackage: params.npmPackage,
    noTweak: Boolean(opts.noTweak),
    promptPack,
    skillInstall,
    shellEnv,
    skillUpdate,
    modelOverrides: resolvedModelOverrides,
    enableTeamMode,
    tweakccStdio: 'pipe',
  });

  const modelNote = formatModelNote(resolvedModelOverrides);
  const notes = [...(result.notes || []), ...(modelNote ? [modelNote] : [])];
  printSummary({
    action: 'Created',
    meta: result.meta,
    wrapperPath: result.wrapperPath,
    notes: notes.length > 0 ? notes : undefined,
  });
}

/**
 * Handle interactive mode creation (full prompts)
 */
async function handleInteractiveMode(opts: ParsedArgs, params: CreateParams): Promise<void> {
  const { provider } = params;
  const promptPack = opts['no-prompt-pack'] ? false : undefined;
  const skillInstall = opts['no-skill-install'] ? false : undefined;
  const skillUpdate = Boolean(opts['skill-update']);
  let shellEnv = opts['no-shell-env'] ? false : opts['shell-env'] ? true : undefined;
  const modelOverrides = getModelOverridesFromArgs(opts);

  const nextName = await prompt('Variant name', params.name);
  const nextBase = await prompt('ANTHROPIC_BASE_URL', params.baseUrl);

  let nextKey = params.shouldPromptApiKey
    ? params.requiresCredential
      ? await requirePrompt(provider.apiKeyLabel || 'ANTHROPIC_API_KEY', params.apiKey)
      : await prompt(provider.apiKeyLabel || 'ANTHROPIC_API_KEY', params.apiKey)
    : params.apiKey;
  if (params.requiresCredential && !nextKey) {
    nextKey = await requirePrompt(provider.apiKeyLabel || 'ANTHROPIC_API_KEY', params.apiKey);
  }

  const resolvedModelOverrides = await ensureModelMapping(params.providerKey, opts, { ...modelOverrides });

  const brandOptions = listBrandPresets()
    .map((item) => item.key)
    .join(', ');
  const brandHint = brandOptions.length > 0 ? `auto, none, ${brandOptions}` : 'auto, none';
  const nextBrand = await prompt(`Brand preset (${brandHint})`, params.brand);
  const nextRoot = await prompt('Variants root directory', params.rootDir);
  const nextBin = await prompt('Wrapper install directory', params.binDir);
  const nextNpmPackage = await prompt('NPM package', params.npmPackage);

  const envInput = await prompt('Extra env (KEY=VALUE, comma separated)', params.extraEnv.join(','));
  const parsedEnv = envInput
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);

  if (params.providerKey === 'zai' && shellEnv === undefined) {
    if (params.hasZaiEnv) {
      shellEnv = false;
    } else {
      const answer = await prompt('Write Z_AI_API_KEY to your shell profile? (yes/no)', 'yes');
      shellEnv = answer.trim().toLowerCase().startsWith('y');
    }
  }

  // Team mode: only available when TEAM_MODE_SUPPORTED is true
  let enableTeamMode = false;
  if (core.TEAM_MODE_SUPPORTED) {
    enableTeamMode = true;
    if (opts['disable-team-mode']) {
      enableTeamMode = false;
    } else if (!opts['enable-team-mode']) {
      const answer = await prompt('Enable team mode (multi-agent collaboration)? (yes/no)', 'yes');
      enableTeamMode = answer.trim().toLowerCase().startsWith('y');
    }
  }

  const result = core.createVariant({
    name: nextName,
    providerKey: params.providerKey,
    baseUrl: nextBase,
    apiKey: nextKey,
    brand: nextBrand,
    extraEnv: parsedEnv,
    rootDir: nextRoot,
    binDir: nextBin,
    npmPackage: nextNpmPackage,
    noTweak: Boolean(opts.noTweak),
    promptPack,
    skillInstall,
    shellEnv,
    skillUpdate,
    modelOverrides: resolvedModelOverrides,
    enableTeamMode,
    tweakccStdio: 'pipe',
  });

  const modelNote = formatModelNote(resolvedModelOverrides);
  const notes = [...(result.notes || []), ...(modelNote ? [modelNote] : [])];
  printSummary({
    action: 'Created',
    meta: result.meta,
    wrapperPath: result.wrapperPath,
    notes: notes.length > 0 ? notes : undefined,
  });
}

/**
 * Handle non-interactive mode creation (--yes flag)
 */
async function handleNonInteractiveMode(opts: ParsedArgs, params: CreateParams): Promise<void> {
  const promptPack = opts['no-prompt-pack'] ? false : undefined;
  const skillInstall = opts['no-skill-install'] ? false : undefined;
  const skillUpdate = Boolean(opts['skill-update']);
  const shellEnv = opts['no-shell-env'] ? false : opts['shell-env'] ? true : undefined;
  const modelOverrides = getModelOverridesFromArgs(opts);

  if (params.requiresCredential && !params.apiKey) {
    throw new Error('Provider API key required (use --api-key)');
  }

  const resolvedModelOverrides = await ensureModelMapping(params.providerKey, opts, { ...modelOverrides });

  // Team mode enabled by default (use --disable-team-mode to opt out) when supported
  const enableTeamMode = core.TEAM_MODE_SUPPORTED ? (opts['disable-team-mode'] ? false : true) : false;

  const result = core.createVariant({
    name: params.name,
    providerKey: params.providerKey,
    baseUrl: params.baseUrl,
    apiKey: params.apiKey,
    brand: params.brand,
    extraEnv: params.extraEnv,
    rootDir: params.rootDir,
    binDir: params.binDir,
    npmPackage: params.npmPackage,
    noTweak: Boolean(opts.noTweak),
    promptPack,
    skillInstall,
    shellEnv,
    skillUpdate,
    modelOverrides: resolvedModelOverrides,
    enableTeamMode,
    tweakccStdio: 'pipe',
  });

  const modelNote = formatModelNote(resolvedModelOverrides);
  const notes = [...(result.notes || []), ...(modelNote ? [modelNote] : [])];
  printSummary({
    action: 'Created',
    meta: result.meta,
    wrapperPath: result.wrapperPath,
    notes: notes.length > 0 ? notes : undefined,
  });
}

/**
 * Execute the create command
 */
export async function runCreateCommand({ opts, quickMode }: CreateCommandOptions): Promise<void> {
  const params = await prepareCreateParams(opts);
  if (!core.TEAM_MODE_SUPPORTED && (opts['enable-team-mode'] || opts['disable-team-mode'])) {
    console.log('Team mode flags are ignored in this release. Use cc-mirror 1.6.3 for team mode support.');
  }

  if (quickMode) {
    await handleQuickMode(opts, params);
  } else if (opts.yes) {
    await handleNonInteractiveMode(opts, params);
  } else {
    await handleInteractiveMode(opts, params);
  }
}
