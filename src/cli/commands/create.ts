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
  claudeVersion: string;
  extraEnv: string[];
  requiresCredential: boolean;
  shouldPromptApiKey: boolean;
  hasZaiEnv: boolean;
  allowCollision: boolean;
}

const buildDefaultName = (provider: ProviderTemplate, providerKey: string, opts: ParsedArgs): string => {
  const explicitName = typeof opts.name === 'string' ? opts.name.trim() : '';
  if (explicitName) return explicitName;
  const prefix = typeof opts.prefix === 'string' ? opts.prefix.trim() : '';
  if (prefix) return `${prefix}${providerKey}`;
  return provider.defaultVariantName || providerKey;
};

const assertNoCommandCollision = (
  name: string,
  binDir: string,
  provider: ProviderTemplate,
  providerKey: string,
  allowCollision: boolean
): void => {
  const collision = core.detectCommandCollision(name, binDir);
  if (!collision.hasCollision || allowCollision) return;

  const suggested = provider.defaultVariantName || `cc${providerKey}`;
  const reasons: string[] = [];
  if (collision.wrapperExists) {
    reasons.push(`wrapper already exists at ${collision.wrapperPath}`);
  }
  if (collision.pathConflicts && collision.resolvedCommandPath) {
    reasons.push(`'${name}' already resolves to ${collision.resolvedCommandPath}`);
  }

  throw new Error(
    `Command name collision for "${name}": ${reasons.join('; ')}. ` +
      `Use --name <unique-name> (suggested: "${suggested}") or --allow-collision to bypass.`
  );
};

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

  const name = buildDefaultName(provider, providerKey, opts);
  const baseUrl = (opts['base-url'] as string) || provider.baseUrl;
  const envZaiKey = providerKey === 'zai' ? process.env.Z_AI_API_KEY : undefined;
  const envAnthropicKey = providerKey === 'zai' ? process.env.ANTHROPIC_API_KEY : undefined;
  const apiKeyFlag = typeof opts['api-key'] === 'string' ? (opts['api-key'] as string) : '';
  const authTokenFlag = typeof opts['auth-token'] === 'string' ? (opts['auth-token'] as string) : '';
  const hasCredentialFlag = Boolean(apiKeyFlag || authTokenFlag);
  const hasZaiEnv = Boolean(envZaiKey);
  const apiKeyDetected = !hasCredentialFlag && hasZaiEnv;
  const apiKey = apiKeyFlag || authTokenFlag || (providerKey === 'zai' ? envZaiKey || envAnthropicKey || '' : '');

  if (apiKeyDetected && !opts.yes) {
    console.log('Detected Z_AI_API_KEY in environment. Using it by default.');
  }

  const brand = (opts.brand as string) || 'auto';
  const rootDir = (opts.root as string) || core.DEFAULT_ROOT;
  const binDir = (opts['bin-dir'] as string) || core.DEFAULT_BIN_DIR;
  const claudeVersion = (opts['claude-version'] as string) || core.DEFAULT_CLAUDE_VERSION || 'latest';
  const extraEnv = buildExtraEnv(opts);
  const requiresCredential = !provider.credentialOptional;
  // Don't prompt for API key if credential is optional (mirror, ccrouter)
  const shouldPromptApiKey =
    !provider.credentialOptional && !opts.yes && !hasCredentialFlag && (providerKey === 'zai' ? !hasZaiEnv : !apiKey);
  const allowCollision = Boolean(opts['allow-collision']);

  return {
    provider,
    providerKey,
    name,
    baseUrl,
    apiKey,
    brand,
    rootDir,
    binDir,
    claudeVersion,
    extraEnv,
    requiresCredential,
    shouldPromptApiKey,
    hasZaiEnv,
    allowCollision,
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

  const result = await core.createVariantAsync({
    name: params.name,
    providerKey: params.providerKey,
    baseUrl: params.baseUrl,
    apiKey,
    brand: params.brand,
    extraEnv: params.extraEnv,
    rootDir: params.rootDir,
    binDir: params.binDir,
    claudeVersion: params.claudeVersion,
    noTweak: Boolean(opts.noTweak),
    promptPack,
    skillInstall,
    shellEnv,
    skillUpdate,
    allowCollision: params.allowCollision,
    modelOverrides: resolvedModelOverrides,
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
  const nextClaudeVersion = await prompt('Claude Code version (stable/latest/x.y.z)', params.claudeVersion);

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

  assertNoCommandCollision(nextName, nextBin, params.provider, params.providerKey, params.allowCollision);

  const result = await core.createVariantAsync({
    name: nextName,
    providerKey: params.providerKey,
    baseUrl: nextBase,
    apiKey: nextKey,
    brand: nextBrand,
    extraEnv: parsedEnv,
    rootDir: nextRoot,
    binDir: nextBin,
    claudeVersion: nextClaudeVersion,
    noTweak: Boolean(opts.noTweak),
    promptPack,
    skillInstall,
    shellEnv,
    skillUpdate,
    allowCollision: params.allowCollision,
    modelOverrides: resolvedModelOverrides,
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

  const result = await core.createVariantAsync({
    name: params.name,
    providerKey: params.providerKey,
    baseUrl: params.baseUrl,
    apiKey: params.apiKey,
    claudeVersion: params.claudeVersion,
    brand: params.brand,
    extraEnv: params.extraEnv,
    rootDir: params.rootDir,
    binDir: params.binDir,
    noTweak: Boolean(opts.noTweak),
    promptPack,
    skillInstall,
    shellEnv,
    skillUpdate,
    allowCollision: params.allowCollision,
    modelOverrides: resolvedModelOverrides,
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

  if (quickMode || opts.yes) {
    assertNoCommandCollision(params.name, params.binDir, params.provider, params.providerKey, params.allowCollision);
  }

  if (quickMode) {
    await handleQuickMode(opts, params);
  } else if (opts.yes) {
    await handleNonInteractiveMode(opts, params);
  } else {
    await handleInteractiveMode(opts, params);
  }
}
