import fs from 'node:fs';
import path from 'node:path';
import { readJson, writeJson } from './fs.js';

type ClaudeConfig = {
  customApiKeyResponses?: {
    approved?: string[];
    rejected?: string[];
  };
  mcpServers?: Record<string, McpServerConfig>;
  theme?: string;
  hasCompletedOnboarding?: boolean;
  lastOnboardingVersion?: string;
};

type SettingsFile = {
  env?: Record<string, string | number | undefined>;
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
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed === PLACEHOLDER_KEY) return null;
  return trimmed;
};

const readSettingsApiKey = (configDir: string): string | null => {
  const settingsPath = path.join(configDir, SETTINGS_FILE);
  const settings = readJson<SettingsFile>(settingsPath);
  if (!settings?.env) return null;
  const env = settings.env;
  return toStringOrNull(env.ANTHROPIC_API_KEY);
};

const ZAI_DENY_TOOLS = [
  'mcp__4_5v_mcp__analyze_image',
  'mcp__milk_tea_server__claim_milk_tea_coupon',
  'mcp__web_reader__webReader',
];

export const ensureZaiMcpDeny = (configDir: string): boolean => {
  const settingsPath = path.join(configDir, SETTINGS_FILE);
  const existing = readJson<SettingsFile>(settingsPath) || {};
  const permissions = existing.permissions || {};
  const deny = Array.isArray(permissions.deny) ? [...permissions.deny] : [];
  let changed = false;
  for (const tool of ZAI_DENY_TOOLS) {
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

export const ensureMinimaxMcpServer = (configDir: string, apiKey?: string | null): boolean => {
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
  if (existingServers.MiniMax) return false;

  const mcpServer: McpServerConfig = {
    command: 'uvx',
    args: ['minimax-coding-plan-mcp', '-y'],
    env: {
      MINIMAX_API_KEY: resolvedKey ?? 'Enter your API key',
      MINIMAX_API_HOST: 'https://api.minimax.io',
    },
  };

  const next: ClaudeConfig = {
    ...config,
    mcpServers: {
      ...existingServers,
      MiniMax: mcpServer,
    },
  };

  writeJson(configPath, next);
  return true;
};
