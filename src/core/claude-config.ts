import fs from 'node:fs';
import path from 'node:path';
import { readJson, writeJson } from './fs.js';
import type { ManagedMcpServer } from '../providers/index.js';

type ClaudeConfig = {
  customApiKeyResponses?: {
    approved?: string[];
    rejected?: string[];
  };
  mcpServers?: Record<string, McpServerConfig>;
  theme?: string;
  hasCompletedOnboarding?: boolean;
  lastOnboardingVersion?: string;
  opus47LaunchSeenCount?: number;
  opus48LaunchSeenCount?: number;
  passesUpsellSeenCount?: number;
  fullscreenUpsellSeenCount?: number;
  fullscreenDownsellSeenCount?: number;
  desktopUpsellSeenCount?: number;
  desktopUpsellDismissed?: boolean;
  pushNotifUpsellSeenCount?: number;
  remoteControlUpsellSeenCount?: number;
  opus1mMergeNoticeSeenCount?: number;
  projectOnboardingSeenCount?: number;
  voiceNoticeSeenCount?: number;
  voiceFooterHintSeenCount?: number;
  unpinOpus47LaunchEffort?: boolean;
  unpinOpus48LaunchEffort?: boolean;
};

type SettingsFile = {
  env?: Record<string, string | number | undefined>;
  model?: string;
  availableModels?: string[];
  companyAnnouncements?: string[];
  spinnerTipsEnabled?: boolean;
  feedbackSurveyRate?: number;
  includeCoAuthoredBy?: boolean;
  attribution?: {
    commit?: string;
    pr?: string;
  };
  permissions?: {
    allow?: string[];
    ask?: string[];
    deny?: string[];
  };
};

type McpServerConfig = {
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  url?: string;
  headers?: string[];
  transport?: string;
};

const SETTINGS_FILE = 'settings.json';
const CLAUDE_CONFIG_FILE = '.claude.json';
const PLACEHOLDER_KEY = '<API_KEY>';

const toStringOrNull = (value: unknown): string | null => {
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const trimmed = String(value).trim();
  if (!trimmed || trimmed === PLACEHOLDER_KEY) return null;
  return trimmed;
};

const readSettingsApiKey = (configDir: string): string | null => {
  const settingsPath = path.join(configDir, SETTINGS_FILE);
  const settings = readJson<SettingsFile>(settingsPath);
  if (!settings?.env) return null;
  const env = settings.env;
  return toStringOrNull(env.ANTHROPIC_API_KEY) || toStringOrNull(env.ANTHROPIC_AUTH_TOKEN);
};

export const ZAI_DENY_TOOLS = [
  // Z.ai injects these MCP tools; they can break expected cc-mirror behavior.
  'mcp__4_5v_mcp__analyze_image',
  'mcp__milk_tea_server__claim_milk_tea_coupon',
  'mcp__web_reader__webReader',
  // Built-in tools that should be routed via zai-cli instead.
  'WebSearch',
  'WebFetch',
];

export const MINIMAX_DENY_TOOLS = [
  // WebSearch should use mcp__MiniMax__web_search instead.
  'WebSearch',
];

export const ensureSettingsPermissionsDeny = (configDir: string, tools: string[]): boolean => {
  const settingsPath = path.join(configDir, SETTINGS_FILE);
  const existing = readJson<SettingsFile>(settingsPath) || {};
  const permissions = existing.permissions || {};
  const deny = Array.isArray(permissions.deny) ? [...permissions.deny] : [];

  let changed = false;
  for (const tool of tools) {
    if (!deny.includes(tool)) {
      deny.push(tool);
      changed = true;
    }
  }

  if (!changed) return false;

  const next: SettingsFile = {
    ...existing,
    permissions: {
      ...permissions,
      deny,
    },
  };

  writeJson(settingsPath, next);
  return true;
};

export const ensureSettingsEnvDefaults = (configDir: string, defaults: Record<string, string | number>): boolean => {
  const settingsPath = path.join(configDir, SETTINGS_FILE);
  const existing = readJson<SettingsFile>(settingsPath) || {};
  const env: Record<string, string | number | undefined> = { ...(existing.env ?? {}) };
  let changed = false;

  for (const [key, value] of Object.entries(defaults)) {
    if (!Object.hasOwn(env, key)) {
      env[key] = value;
      changed = true;
    }
  }

  if (!changed) return false;
  writeJson(settingsPath, { ...existing, env });
  return true;
};

export const removeSettingsEnvKeys = (configDir: string, keys: string[]): boolean => {
  const settingsPath = path.join(configDir, SETTINGS_FILE);
  const existing = readJson<SettingsFile>(settingsPath) || {};
  if (!existing.env) return false;
  const env = { ...existing.env };
  let changed = false;
  for (const key of keys) {
    if (Object.hasOwn(env, key)) {
      delete env[key];
      changed = true;
    }
  }
  if (!changed) return false;
  writeJson(settingsPath, { ...existing, env });
  return true;
};

export const ensureSettingsEnvOverrides = (
  configDir: string,
  overrides: Record<string, string | number | undefined>
): boolean => {
  const settingsPath = path.join(configDir, SETTINGS_FILE);
  const existing = readJson<SettingsFile>(settingsPath) || {};
  const env: Record<string, string | number | undefined> = { ...(existing.env ?? {}) };
  let changed = false;

  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined) continue;
    if (env[key] !== value) {
      env[key] = value;
      changed = true;
    }
  }

  if (!changed) return false;
  writeJson(settingsPath, { ...existing, env });
  return true;
};

export type ManagedEnvSyncOptions = {
  desiredEnv: Record<string, string | number | undefined>;
  managedKeys: string[];
  credentialKeys?: string[];
  removeKeys?: string[];
};

export const syncSettingsManagedEnv = (configDir: string, opts: ManagedEnvSyncOptions): boolean => {
  const settingsPath = path.join(configDir, SETTINGS_FILE);
  const existing = readJson<SettingsFile>(settingsPath) || {};
  const env: Record<string, string | number | undefined> = { ...(existing.env ?? {}) };
  const managedKeys = new Set(opts.managedKeys);
  const credentialKeys = new Set(opts.credentialKeys ?? []);
  const removeKeys = new Set(opts.removeKeys ?? []);
  let changed = false;

  for (const key of managedKeys) {
    if (!Object.hasOwn(opts.desiredEnv, key) && !credentialKeys.has(key) && Object.hasOwn(env, key)) {
      delete env[key];
      changed = true;
    }
  }

  for (const key of removeKeys) {
    if (Object.hasOwn(env, key)) {
      delete env[key];
      changed = true;
    }
  }

  for (const [key, value] of Object.entries(opts.desiredEnv)) {
    if (value === undefined) continue;
    const shouldPreserveCredential =
      credentialKeys.has(key) && String(value).trim() !== '' && Boolean(toStringOrNull(env[key]));
    if (shouldPreserveCredential) continue;
    if (env[key] !== value) {
      env[key] = value;
      changed = true;
    }
  }

  if (!changed) return false;
  writeJson(settingsPath, { ...existing, env });
  return true;
};

export const ensureSettingsModel = (configDir: string, model: string | undefined): boolean => {
  if (!model) return false;
  const settingsPath = path.join(configDir, SETTINGS_FILE);
  const existing = readJson<SettingsFile>(settingsPath) || {};
  if (existing.model === model) return false;
  writeJson(settingsPath, { ...existing, model });
  return true;
};

const jsonEqual = (a: unknown, b: unknown): boolean => JSON.stringify(a) === JSON.stringify(b);

export const syncSettingsManagedDefaults = (configDir: string, defaults: Partial<SettingsFile>): boolean => {
  const settingsPath = path.join(configDir, SETTINGS_FILE);
  const existing = readJson<SettingsFile>(settingsPath) || {};
  let changed = false;
  const next: SettingsFile = { ...existing };

  for (const [key, value] of Object.entries(defaults) as Array<[keyof SettingsFile, unknown]>) {
    if (value === undefined) {
      if (Object.hasOwn(next, key)) {
        delete next[key];
        changed = true;
      }
      continue;
    }
    if (!jsonEqual(next[key], value)) {
      (next as Record<string, unknown>)[key] = value;
      changed = true;
    }
  }

  if (!changed) return false;
  writeJson(settingsPath, next);
  return true;
};

export type SettingsModelMigration = {
  staleModels: readonly string[];
  replacements: {
    opus: string;
    sonnet: string;
    haiku: string;
  };
};

const normalizeModelForCompare = (value: unknown): string => {
  if (typeof value !== 'string' && typeof value !== 'number') return '';
  return String(value).trim().toLowerCase();
};

export const ensureSettingsModelMigration = (configDir: string, migration: SettingsModelMigration): boolean => {
  const settingsPath = path.join(configDir, SETTINGS_FILE);
  const existing = readJson<SettingsFile>(settingsPath) || {};
  const env: Record<string, string | number | undefined> = { ...(existing.env ?? {}) };
  const staleModels = new Set(migration.staleModels.map((model) => model.trim().toLowerCase()).filter(Boolean));
  if (staleModels.size === 0) return false;

  const replacements: Array<[string, string]> = [
    ['ANTHROPIC_DEFAULT_OPUS_MODEL', migration.replacements.opus],
    ['ANTHROPIC_DEFAULT_SONNET_MODEL', migration.replacements.sonnet],
    ['ANTHROPIC_DEFAULT_HAIKU_MODEL', migration.replacements.haiku],
    ['ANTHROPIC_SMALL_FAST_MODEL', migration.replacements.haiku],
  ];

  let changed = false;
  for (const [key, replacement] of replacements) {
    const current = normalizeModelForCompare(env[key]);
    if (!staleModels.has(current)) continue;
    env[key] = replacement;
    changed = true;
  }

  if (staleModels.has(normalizeModelForCompare(env.ANTHROPIC_MODEL))) {
    delete env.ANTHROPIC_MODEL;
    changed = true;
  }

  if (!changed) return false;
  writeJson(settingsPath, { ...existing, env });
  return true;
};

export const ensureZaiAuthTokenSettings = (configDir: string): boolean => {
  return ensureAuthTokenCredentialSettings(configDir, {
    derivedCredentialEnv: ['Z_AI_API_KEY'],
    emptyApiKey: true,
  });
};

export const ensureAuthTokenCredentialSettings = (
  configDir: string,
  opts: {
    derivedCredentialEnv?: string[];
    emptyApiKey?: boolean;
    authTokenAlsoSetsApiKey?: boolean;
    fallbackToken?: string;
  } = {}
): boolean => {
  const settingsPath = path.join(configDir, SETTINGS_FILE);
  const existing = readJson<SettingsFile>(settingsPath) || {};
  const env: Record<string, string | number | undefined> = { ...(existing.env ?? {}) };
  const credential =
    toStringOrNull(env.ANTHROPIC_AUTH_TOKEN) ||
    (opts.derivedCredentialEnv ?? []).map((key) => toStringOrNull(env[key])).find(Boolean) ||
    toStringOrNull(env.ANTHROPIC_API_KEY) ||
    opts.fallbackToken ||
    null;

  let changed = false;
  if (credential && env.ANTHROPIC_AUTH_TOKEN !== credential) {
    env.ANTHROPIC_AUTH_TOKEN = credential;
    changed = true;
  }
  for (const key of opts.derivedCredentialEnv ?? []) {
    if (credential && env[key] !== credential) {
      env[key] = credential;
      changed = true;
    }
  }
  if (opts.authTokenAlsoSetsApiKey && credential && env.ANTHROPIC_API_KEY !== credential) {
    env.ANTHROPIC_API_KEY = credential;
    changed = true;
  } else if (opts.emptyApiKey && env.ANTHROPIC_API_KEY !== '') {
    env.ANTHROPIC_API_KEY = '';
    changed = true;
  }

  if (!changed) return false;
  writeJson(settingsPath, { ...existing, env });
  return true;
};

export const ensureMinimaxAuthTokenSettings = (configDir: string): boolean => {
  return ensureAuthTokenCredentialSettings(configDir, { emptyApiKey: true });
};

export const ensureApiKeyApproval = (configDir: string, apiKey?: string | null): boolean => {
  const resolvedKey = toStringOrNull(apiKey) || readSettingsApiKey(configDir);
  if (!resolvedKey) return false;

  const approvedToken = resolvedKey.slice(-20);
  const configPath = path.join(configDir, CLAUDE_CONFIG_FILE);
  const exists = fs.existsSync(configPath);

  let config: ClaudeConfig | null = null;
  if (exists) {
    config = readJson<ClaudeConfig>(configPath);
    if (!config) return false;
  } else {
    config = {};
  }

  const approved = Array.isArray(config.customApiKeyResponses?.approved)
    ? [...config.customApiKeyResponses.approved]
    : [];
  const rejected = Array.isArray(config.customApiKeyResponses?.rejected)
    ? [...config.customApiKeyResponses.rejected]
    : [];

  if (approved.includes(approvedToken)) return false;

  approved.push(approvedToken);
  const next: ClaudeConfig = {
    ...config,
    customApiKeyResponses: {
      ...config.customApiKeyResponses,
      approved,
      rejected,
    },
  };

  writeJson(configPath, next);
  return true;
};

export type OnboardingStateResult = {
  updated: boolean;
  themeChanged: boolean;
  onboardingChanged: boolean;
};

export const ensureOnboardingState = (
  configDir: string,
  opts: { themeId?: string | null; forceTheme?: boolean; skipOnboardingFlag?: boolean } = {}
): OnboardingStateResult => {
  const configPath = path.join(configDir, CLAUDE_CONFIG_FILE);
  const exists = fs.existsSync(configPath);

  let config: ClaudeConfig | null = null;
  if (exists) {
    config = readJson<ClaudeConfig>(configPath);
    if (!config) {
      return { updated: false, themeChanged: false, onboardingChanged: false };
    }
  } else {
    config = {};
  }

  let changed = false;
  let themeChanged = false;
  let onboardingChanged = false;
  if (opts.themeId) {
    const shouldSetTheme = opts.forceTheme || !config.theme;
    if (shouldSetTheme && config.theme !== opts.themeId) {
      config.theme = opts.themeId;
      changed = true;
      themeChanged = true;
    }
  }

  // Skip setting hasCompletedOnboarding for providers that want users to see login screen
  if (!opts.skipOnboardingFlag && config.hasCompletedOnboarding !== true) {
    config.hasCompletedOnboarding = true;
    changed = true;
    onboardingChanged = true;
  }

  if (!changed) {
    return { updated: false, themeChanged: false, onboardingChanged: false };
  }
  writeJson(configPath, config);
  return { updated: true, themeChanged, onboardingChanged };
};

const SUPPRESS_STARTUP_COUNT = 999;

export const ensureClaudeConfigUiSuppressions = (configDir: string): boolean => {
  const configPath = path.join(configDir, CLAUDE_CONFIG_FILE);
  const exists = fs.existsSync(configPath);
  const config = exists ? readJson<ClaudeConfig>(configPath) : {};
  if (!config) return false;

  const suppressions: Partial<ClaudeConfig> = {
    opus47LaunchSeenCount: SUPPRESS_STARTUP_COUNT,
    opus48LaunchSeenCount: SUPPRESS_STARTUP_COUNT,
    passesUpsellSeenCount: SUPPRESS_STARTUP_COUNT,
    fullscreenUpsellSeenCount: SUPPRESS_STARTUP_COUNT,
    fullscreenDownsellSeenCount: SUPPRESS_STARTUP_COUNT,
    desktopUpsellSeenCount: SUPPRESS_STARTUP_COUNT,
    desktopUpsellDismissed: true,
    pushNotifUpsellSeenCount: SUPPRESS_STARTUP_COUNT,
    remoteControlUpsellSeenCount: SUPPRESS_STARTUP_COUNT,
    opus1mMergeNoticeSeenCount: SUPPRESS_STARTUP_COUNT,
    projectOnboardingSeenCount: SUPPRESS_STARTUP_COUNT,
    voiceNoticeSeenCount: SUPPRESS_STARTUP_COUNT,
    voiceFooterHintSeenCount: SUPPRESS_STARTUP_COUNT,
    unpinOpus47LaunchEffort: true,
    unpinOpus48LaunchEffort: true,
  };

  let changed = false;
  const next: ClaudeConfig = { ...config };
  for (const [key, value] of Object.entries(suppressions) as Array<[keyof ClaudeConfig, unknown]>) {
    if (next[key] !== value) {
      (next as Record<string, unknown>)[key] = value;
      changed = true;
    }
  }

  if (!changed) return false;
  writeJson(configPath, next);
  return true;
};

export const ensureMinimaxMcpServer = (configDir: string, apiKey?: string | null): boolean => {
  return ensureManagedMcpServers(
    configDir,
    [
      {
        id: 'MiniMax',
        command: 'uvx',
        args: ['minimax-coding-plan-mcp', '-y'],
        env: {
          MINIMAX_API_KEY: '${credential}',
          MINIMAX_API_HOST: 'https://api.minimax.io',
        },
      },
    ],
    apiKey
  );
};

export const ensureManagedMcpServers = (
  configDir: string,
  servers: ManagedMcpServer[],
  apiKey?: string | null
): boolean => {
  const resolvedKey = toStringOrNull(apiKey) || readSettingsApiKey(configDir);
  const configPath = path.join(configDir, CLAUDE_CONFIG_FILE);
  const exists = fs.existsSync(configPath);

  let config: ClaudeConfig | null = null;
  if (exists) {
    config = readJson<ClaudeConfig>(configPath);
    if (!config) return false;
  } else {
    config = {};
  }

  const existingServers = config.mcpServers ?? {};
  let changed = false;
  const nextServers = { ...existingServers };
  for (const server of servers) {
    const env = server.env
      ? Object.fromEntries(
          Object.entries(server.env).map(([key, value]) => [
            key,
            value === '${credential}' ? (resolvedKey ?? 'Enter your API key') : value,
          ])
        )
      : undefined;
    const nextServer = {
      ...(server.command ? { command: server.command } : {}),
      ...(server.args ? { args: server.args } : {}),
      ...(env ? { env } : {}),
      ...(server.url ? { url: server.url } : {}),
      ...(server.headers ? { headers: server.headers } : {}),
      ...(server.transport ? { transport: server.transport } : {}),
    };
    if (JSON.stringify(nextServers[server.id] ?? null) !== JSON.stringify(nextServer)) {
      nextServers[server.id] = nextServer;
      changed = true;
    }
  }

  if (!changed) return false;

  const next: ClaudeConfig = {
    ...config,
    mcpServers: nextServers,
  };

  writeJson(configPath, next);
  return true;
};
