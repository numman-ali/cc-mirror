import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { MINIMAX_DENY_TOOLS, ZAI_DENY_TOOLS } from '../core/claude-config.js';
import { readJson } from '../core/fs.js';
import { expandTilde } from '../core/paths.js';
import type { DoctorReportItem, VariantEntry, VariantMeta } from '../core/types.js';
import {
  getProvider,
  getProviderCapability,
  type ProviderAuthMode,
  type ProviderCapabilityProfile,
} from '../providers/index.js';

type JsonObject = Record<string, unknown>;

type SettingsFile = {
  env?: Record<string, string | number | undefined>;
  permissions?: {
    allow?: string[];
    ask?: string[];
    deny?: string[];
  };
};

type ClaudeConfigFile = {
  mcpServers?: Record<string, unknown>;
};

export type DoctorFindingSeverity = 'info' | 'warning' | 'error';

export interface DoctorFinding {
  code: string;
  severity: DoctorFindingSeverity;
  message: string;
  area: 'runtime' | 'capabilities' | 'profile';
}

export interface DoctorRuntimeReport {
  ok: boolean;
  settings: 'present' | 'missing' | 'malformed';
  claudeConfig: 'present' | 'missing' | 'malformed';
  auth: {
    mode: ProviderAuthMode | 'unknown';
    ok: boolean;
    requiredEnv: string[];
    presentEnv: string[];
    missingEnv: string[];
    placeholderEnv: string[];
    emptyEnv: string[];
    apiKeyMustBeEmpty?: boolean;
    apiKeyEmpty?: boolean;
  };
  baseUrl: {
    required: boolean;
    present: boolean;
  };
  modelMapping: {
    required: boolean;
    present: string[];
    missing: string[];
  };
  profile: {
    required: boolean;
    status: 'not-applicable' | 'present' | 'missing' | 'unknown';
    variable?: string;
    path?: string;
  };
}

export interface DoctorCapabilitiesReport {
  ok: boolean;
  providerContract: 'provider-capabilities' | 'provider-template' | 'missing';
  permissions: {
    ok: boolean;
    requiredDeny: string[];
    presentDeny: string[];
    missingDeny: string[];
  };
  mcp: {
    ok: boolean;
    expectedServers: string[];
    configuredServers: string[];
    missingServers: string[];
  };
}

export interface ProviderDoctorReportItem extends DoctorReportItem {
  provider?: string;
  runtime?: DoctorRuntimeReport;
  capabilities?: DoctorCapabilitiesReport;
  findings?: DoctorFinding[];
}

export interface EnrichDoctorOptions {
  variants?: VariantEntry[];
  env?: NodeJS.ProcessEnv;
  shellProfilePath?: string | null;
}

const SETTINGS_FILE = 'settings.json';
const CLAUDE_CONFIG_FILE = '.claude.json';
const PLACEHOLDER_VALUES = new Set(['<API_KEY>', 'Enter your API key']);
const NON_SECRET_AUTH_VALUES = new Set(['ollama', 'ccrouter-proxy']);
const MODEL_MAPPING_ENV = [
  'ANTHROPIC_DEFAULT_SONNET_MODEL',
  'ANTHROPIC_DEFAULT_OPUS_MODEL',
  'ANTHROPIC_DEFAULT_HAIKU_MODEL',
] as const;
const SENSITIVE_KEY_PATTERN = /(?:KEY|TOKEN|SECRET|PASSWORD|CREDENTIAL)/i;

const REQUIRED_DENY_BY_PROVIDER: Record<string, string[]> = {
  zai: ZAI_DENY_TOOLS,
  minimax: MINIMAX_DENY_TOOLS,
};

const EXPECTED_MCP_SERVERS_BY_PROVIDER: Record<string, string[]> = {
  minimax: ['MiniMax'],
};

const hasJsonObject = (value: unknown): value is JsonObject =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const readJsonWithStatus = <T>(filePath: string): { status: 'present' | 'missing' | 'malformed'; value: T | null } => {
  if (!fs.existsSync(filePath)) return { status: 'missing', value: null };
  const value = readJson<T>(filePath);
  return value ? { status: 'present', value } : { status: 'malformed', value: null };
};

const readVariantMeta = (rootDir: string, name: string): VariantMeta | null => {
  return readJson<VariantMeta>(path.join(rootDir, name, 'variant.json'));
};

const toEnvString = (value: unknown): string | null => {
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  return String(value);
};

const normalizeEnvValue = (value: unknown): string => toEnvString(value)?.trim() ?? '';

const isPlaceholderValue = (value: unknown): boolean => PLACEHOLDER_VALUES.has(normalizeEnvValue(value));

const hasFilledEnvValue = (env: Record<string, unknown>, key: string): boolean => {
  const value = env[key];
  const normalized = normalizeEnvValue(value);
  return normalized.length > 0 && !PLACEHOLDER_VALUES.has(normalized);
};

const isEmptyEnvValue = (env: Record<string, unknown>, key: string): boolean => {
  if (!Object.hasOwn(env, key)) return false;
  return normalizeEnvValue(env[key]).length === 0;
};

const isTruthyEnvFlag = (env: Record<string, unknown>, key: string): boolean => {
  const normalized = normalizeEnvValue(env[key]).toLowerCase();
  return normalized.length > 0 && normalized !== '0' && normalized !== 'false';
};

const uniqueSorted = (values: string[]): string[] => [...new Set(values)].sort((a, b) => a.localeCompare(b));

const getAuthRequiredEnv = (
  providerKey: string,
  authMode: ProviderAuthMode,
  credentialOptional: boolean,
  profile?: ProviderCapabilityProfile
): string[] => {
  if (profile) {
    return [
      profile.auth.required ? profile.auth.credentialEnv : undefined,
      ...(profile.auth.derivedCredentialEnv ?? []),
      profile.auth.authTokenAlsoSetsApiKey && profile.auth.required ? 'ANTHROPIC_API_KEY' : undefined,
    ].filter((value): value is string => Boolean(value));
  }

  if (authMode === 'none') return [];
  if (authMode === 'apiKey') return credentialOptional ? [] : ['ANTHROPIC_API_KEY'];
  if (providerKey === 'zai') return ['ANTHROPIC_AUTH_TOKEN', 'Z_AI_API_KEY'];
  if (providerKey === 'ollama') return ['ANTHROPIC_AUTH_TOKEN', 'ANTHROPIC_API_KEY'];
  return credentialOptional ? [] : ['ANTHROPIC_AUTH_TOKEN'];
};

const resolveShellProfile = (env: NodeJS.ProcessEnv): string | null => {
  const home = env.HOME || os.homedir();
  const shell = env.SHELL || '';
  const name = path.basename(shell);

  if (name === 'zsh') return path.join(home, '.zshrc');
  if (name === 'bash') {
    const bashrc = path.join(home, '.bashrc');
    if (fs.existsSync(bashrc)) return bashrc;
    return path.join(home, '.bash_profile');
  }
  return null;
};

const hasEnvAssignment = (content: string, variable: string): boolean => {
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const withoutExport = trimmed.startsWith('export ') ? trimmed.slice(7).trim() : trimmed;
    if (!withoutExport.startsWith(`${variable}=`)) continue;
    let value = withoutExport.slice(variable.length + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (value.trim().length > 0 && !PLACEHOLDER_VALUES.has(value.trim())) return true;
  }
  return false;
};

const getProfileStatus = (
  meta: VariantMeta | null,
  env: NodeJS.ProcessEnv,
  profile?: ProviderCapabilityProfile,
  shellProfilePath?: string | null
): DoctorRuntimeReport['profile'] => {
  if (meta?.shellEnv !== true) {
    return { required: false, status: 'not-applicable' };
  }

  const exports = profile?.features.shellEnv.exports ?? (meta.provider === 'zai' ? ['Z_AI_API_KEY'] : []);
  const variable = exports[0];
  if (!variable) {
    return { required: false, status: 'not-applicable' };
  }

  if (normalizeEnvValue(env[variable]).length > 0) {
    return { required: true, status: 'present', variable };
  }

  const profilePath = shellProfilePath !== undefined ? shellProfilePath : resolveShellProfile(env);
  if (!profilePath) {
    return { required: true, status: 'unknown', variable };
  }

  const present = fs.existsSync(profilePath) && hasEnvAssignment(fs.readFileSync(profilePath, 'utf8'), variable);
  return { required: true, status: present ? 'present' : 'missing', variable, path: profilePath };
};

const addFinding = (findings: DoctorFinding[], finding: Omit<DoctorFinding, 'message'> & { message: string }): void => {
  findings.push(finding);
};

const analyzeItem = (
  item: DoctorReportItem,
  rootDir: string,
  meta: VariantMeta | null,
  opts: EnrichDoctorOptions
): ProviderDoctorReportItem => {
  const findings: DoctorFinding[] = [];
  const providerKey = meta?.provider;
  const provider = providerKey ? getProvider(providerKey) : undefined;
  const providerCapability = providerKey ? getProviderCapability(providerKey) : undefined;
  const configDir = meta?.configDir ?? path.join(rootDir, item.name, 'config');
  const settingsResult = readJsonWithStatus<SettingsFile>(path.join(configDir, SETTINGS_FILE));
  const claudeConfigResult = readJsonWithStatus<ClaudeConfigFile>(path.join(configDir, CLAUDE_CONFIG_FILE));
  const settings = settingsResult.value;
  const claudeConfig = claudeConfigResult.value;
  const env = hasJsonObject(settings?.env) ? (settings?.env as Record<string, unknown>) : {};
  const permissionsDeny = Array.isArray(settings?.permissions?.deny)
    ? settings.permissions.deny.filter((entry): entry is string => typeof entry === 'string')
    : [];

  if (!meta) {
    addFinding(findings, {
      code: 'variant-meta-missing',
      severity: 'error',
      area: 'runtime',
      message: 'variant metadata is missing or malformed',
    });
  }
  if (settingsResult.status === 'missing') {
    addFinding(findings, {
      code: 'settings-missing',
      severity: 'error',
      area: 'runtime',
      message: 'settings.json is missing',
    });
  } else if (settingsResult.status === 'malformed') {
    addFinding(findings, {
      code: 'settings-malformed',
      severity: 'error',
      area: 'runtime',
      message: 'settings.json is malformed',
    });
  }
  if (claudeConfigResult.status === 'malformed') {
    addFinding(findings, {
      code: 'claude-config-malformed',
      severity: 'warning',
      area: 'runtime',
      message: '.claude.json is malformed',
    });
  }
  if (providerKey && !provider && !providerCapability) {
    addFinding(findings, {
      code: 'provider-contract-missing',
      severity: 'warning',
      area: 'capabilities',
      message: `no provider contract found for ${providerKey}`,
    });
  }

  const authMode = providerCapability?.auth.mode ?? provider?.authMode ?? (provider ? 'apiKey' : 'unknown');
  const providerId = providerCapability?.key ?? provider?.key;
  const authRequiredEnv =
    providerId && authMode !== 'unknown'
      ? getAuthRequiredEnv(providerId, authMode, Boolean(provider?.credentialOptional), providerCapability)
      : [];
  const presentEnv = authRequiredEnv.filter((key) => hasFilledEnvValue(env, key));
  const missingEnv = authRequiredEnv.filter((key) => !hasFilledEnvValue(env, key));
  const placeholderEnv = authRequiredEnv.filter((key) => isPlaceholderValue(env[key]));
  const emptyEnv = authRequiredEnv.filter((key) => isEmptyEnvValue(env, key));
  const authTokenUnsetByWrapper = authMode === 'authToken' && isTruthyEnvFlag(env, 'CC_MIRROR_UNSET_AUTH_TOKEN');

  for (const key of missingEnv) {
    addFinding(findings, {
      code: 'missing-required-env',
      severity: 'error',
      area: 'runtime',
      message: `missing required env var ${key}`,
    });
  }

  const apiKeyMustBeEmpty = providerCapability?.auth.emptyApiKey ?? Boolean(provider?.requiresEmptyApiKey);
  const apiKeyEmpty = !hasFilledEnvValue(env, 'ANTHROPIC_API_KEY');
  if (apiKeyMustBeEmpty && !apiKeyEmpty) {
    addFinding(findings, {
      code: 'api-key-should-be-empty',
      severity: 'error',
      area: 'runtime',
      message: 'ANTHROPIC_API_KEY must be empty for this auth-token provider',
    });
  }
  if (authTokenUnsetByWrapper) {
    addFinding(findings, {
      code: 'auth-token-unset-by-wrapper',
      severity: 'error',
      area: 'runtime',
      message: 'CC_MIRROR_UNSET_AUTH_TOKEN would remove ANTHROPIC_AUTH_TOKEN before launch',
    });
  }

  const baseUrlRequired =
    providerCapability?.endpoint.managed === true
      ? Boolean(providerCapability.endpoint.defaultBaseUrl)
      : Boolean(provider?.baseUrl && authMode !== 'none');
  const baseUrlPresent = hasFilledEnvValue(env, 'ANTHROPIC_BASE_URL');
  if (baseUrlRequired && !baseUrlPresent) {
    addFinding(findings, {
      code: 'missing-base-url',
      severity: 'error',
      area: 'runtime',
      message: 'missing required env var ANTHROPIC_BASE_URL',
    });
  }

  const modelMappingRequired = providerCapability
    ? providerCapability.models.policy === 'required'
    : Boolean(provider?.requiresModelMapping);
  const presentModelEnv = modelMappingRequired ? MODEL_MAPPING_ENV.filter((key) => hasFilledEnvValue(env, key)) : [];
  const missingModelEnv = modelMappingRequired ? MODEL_MAPPING_ENV.filter((key) => !hasFilledEnvValue(env, key)) : [];
  if (missingModelEnv.length > 0) {
    addFinding(findings, {
      code: 'missing-model-mapping',
      severity: 'error',
      area: 'runtime',
      message: `missing model mapping env vars: ${missingModelEnv.join(', ')}`,
    });
  }

  const requiredDeny =
    providerCapability?.tools.deny ?? (providerKey ? (REQUIRED_DENY_BY_PROVIDER[providerKey] ?? []) : []);
  const missingDeny = requiredDeny.filter((tool) => !permissionsDeny.includes(tool));
  if (missingDeny.length > 0) {
    addFinding(findings, {
      code: 'missing-permission-deny',
      severity: 'error',
      area: 'capabilities',
      message: `missing required permission deny entries: ${missingDeny.join(', ')}`,
    });
  }

  const mcpServers = hasJsonObject(claudeConfig?.mcpServers) ? (claudeConfig?.mcpServers as JsonObject) : {};
  const configuredServers = Object.keys(mcpServers).sort((a, b) => a.localeCompare(b));
  const expectedServers =
    providerCapability?.claudeConfig.mcpServers.map((server) => server.id) ??
    (providerKey ? (EXPECTED_MCP_SERVERS_BY_PROVIDER[providerKey] ?? []) : []);
  const missingServers = expectedServers.filter((server) => !configuredServers.includes(server));
  if (missingServers.length > 0) {
    addFinding(findings, {
      code: 'missing-mcp-server',
      severity: 'error',
      area: 'capabilities',
      message: `missing required MCP servers: ${missingServers.join(', ')}`,
    });
  }

  const profile = getProfileStatus(meta, opts.env ?? process.env, providerCapability, opts.shellProfilePath);
  if (profile.required && profile.status !== 'present') {
    addFinding(findings, {
      code: 'profile-drift',
      severity: 'warning',
      area: 'profile',
      message: `${profile.variable ?? 'provider env'} is not visible in the shell profile`,
    });
  }

  const runtimeError = findings.some((finding) => finding.area === 'runtime' && finding.severity === 'error');
  const capabilitiesError = findings.some((finding) => finding.area === 'capabilities' && finding.severity === 'error');

  return {
    ...item,
    provider: providerKey,
    runtime: {
      ok: !runtimeError,
      settings: settingsResult.status,
      claudeConfig: claudeConfigResult.status,
      auth: {
        mode: authMode,
        ok: missingEnv.length === 0 && (!apiKeyMustBeEmpty || apiKeyEmpty) && !authTokenUnsetByWrapper,
        requiredEnv: uniqueSorted(authRequiredEnv),
        presentEnv: uniqueSorted(presentEnv),
        missingEnv: uniqueSorted(missingEnv),
        placeholderEnv: uniqueSorted(placeholderEnv),
        emptyEnv: uniqueSorted(emptyEnv),
        ...(apiKeyMustBeEmpty ? { apiKeyMustBeEmpty, apiKeyEmpty } : {}),
      },
      baseUrl: {
        required: baseUrlRequired,
        present: !baseUrlRequired || baseUrlPresent,
      },
      modelMapping: {
        required: modelMappingRequired,
        present: uniqueSorted(presentModelEnv),
        missing: uniqueSorted(missingModelEnv),
      },
      profile,
    },
    capabilities: {
      ok: !capabilitiesError,
      providerContract: providerCapability ? 'provider-capabilities' : provider ? 'provider-template' : 'missing',
      permissions: {
        ok: missingDeny.length === 0,
        requiredDeny: uniqueSorted(requiredDeny),
        presentDeny: uniqueSorted(requiredDeny.filter((tool) => permissionsDeny.includes(tool))),
        missingDeny: uniqueSorted(missingDeny),
      },
      mcp: {
        ok: missingServers.length === 0,
        expectedServers: uniqueSorted(expectedServers),
        configuredServers: uniqueSorted(configuredServers),
        missingServers: uniqueSorted(missingServers),
      },
    },
    findings,
  };
};

export const enrichDoctorReport = (
  report: DoctorReportItem[],
  rootDir: string,
  opts: EnrichDoctorOptions = {}
): ProviderDoctorReportItem[] => {
  const resolvedRoot = expandTilde(rootDir) ?? rootDir;
  const metaByName = new Map((opts.variants ?? []).map((entry) => [entry.name, entry.meta] as const));
  return report.map((item) => {
    const meta = metaByName.has(item.name)
      ? (metaByName.get(item.name) ?? null)
      : readVariantMeta(resolvedRoot, item.name);
    return analyzeItem(item, resolvedRoot, meta, opts);
  });
};

const collectSensitiveValuesFromEnv = (env: Record<string, unknown> | undefined, values: string[]): void => {
  if (!env) return;
  for (const [key, value] of Object.entries(env)) {
    if (!SENSITIVE_KEY_PATTERN.test(key)) continue;
    const normalized = normalizeEnvValue(value);
    if (normalized.length >= 6 && !PLACEHOLDER_VALUES.has(normalized) && !NON_SECRET_AUTH_VALUES.has(normalized)) {
      values.push(normalized);
    }
  }
};

export const collectDoctorSecretValues = (
  rootDir: string,
  name: string,
  env: NodeJS.ProcessEnv = process.env
): string[] => {
  const resolvedRoot = expandTilde(rootDir) ?? rootDir;
  const meta = readVariantMeta(resolvedRoot, name);
  const configDir = meta?.configDir ?? path.join(resolvedRoot, name, 'config');
  const settings = readJson<SettingsFile>(path.join(configDir, SETTINGS_FILE));
  const claudeConfig = readJson<ClaudeConfigFile>(path.join(configDir, CLAUDE_CONFIG_FILE));
  const values: string[] = [];

  collectSensitiveValuesFromEnv(env as Record<string, unknown>, values);
  collectSensitiveValuesFromEnv(settings?.env as Record<string, unknown> | undefined, values);
  if (hasJsonObject(claudeConfig?.mcpServers)) {
    for (const server of Object.values(claudeConfig.mcpServers)) {
      if (!hasJsonObject(server)) continue;
      collectSensitiveValuesFromEnv(server.env as Record<string, unknown> | undefined, values);
      collectSensitiveValuesFromEnv(server.headers as Record<string, unknown> | undefined, values);
    }
  }
  return uniqueSorted(values);
};

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const sanitizeDoctorText = (text: string, secrets: string[] = []): string => {
  let sanitized = text;
  for (const secret of uniqueSorted(secrets).sort((a, b) => b.length - a.length)) {
    if (!secret) continue;
    sanitized = sanitized.replace(new RegExp(escapeRegExp(secret), 'g'), '<redacted>');
  }
  return sanitized.replace(
    /([A-Z0-9_]*(?:KEY|TOKEN|SECRET|PASSWORD|CREDENTIAL)[A-Z0-9_]*=)(?:"[^"]*"|'[^']*'|[^\s]+)/gi,
    '$1<redacted>'
  );
};

const isProviderDoctorReportItem = (item: DoctorReportItem): item is ProviderDoctorReportItem =>
  Boolean((item as ProviderDoctorReportItem).runtime || (item as ProviderDoctorReportItem).capabilities);

const findingPrefix = (severity: DoctorFindingSeverity): string => {
  if (severity === 'error') return '✗';
  if (severity === 'warning') return '!';
  return '·';
};

const formatListStatus = (ok: boolean, label: string, missing: string[]): string => {
  if (ok) return `${label} ok`;
  return `${label} missing ${missing.join(', ')}`;
};

export const printDoctor = (report: DoctorReportItem[]) => {
  if (report.length === 0) {
    console.log('No variants found.');
    return;
  }
  for (const item of report) {
    const providerSuffix = isProviderDoctorReportItem(item) && item.provider ? ` (${item.provider})` : '';
    console.log(`${item.ok ? '✓' : '✗'} ${item.name}${providerSuffix}`);
    if (isProviderDoctorReportItem(item)) {
      if (item.runtime) {
        const runtimeParts = [
          formatListStatus(item.runtime.auth.ok, 'env', item.runtime.auth.missingEnv),
          item.runtime.baseUrl.required
            ? `base URL ${item.runtime.baseUrl.present ? 'ok' : 'missing'}`
            : 'base URL not required',
          item.runtime.modelMapping.required
            ? formatListStatus(
                item.runtime.modelMapping.missing.length === 0,
                'model mapping',
                item.runtime.modelMapping.missing
              )
            : 'model mapping not required',
        ];
        console.log(`  runtime: ${runtimeParts.join('; ')}`);
      }
      if (item.capabilities) {
        const capabilityParts = [
          formatListStatus(item.capabilities.permissions.ok, 'permissions', item.capabilities.permissions.missingDeny),
          formatListStatus(item.capabilities.mcp.ok, 'MCP', item.capabilities.mcp.missingServers),
        ];
        console.log(`  capabilities: ${capabilityParts.join('; ')}`);
      }
      for (const finding of item.findings ?? []) {
        console.log(`  ${findingPrefix(finding.severity)} ${finding.message}`);
      }
    }
    if (!item.ok) {
      console.log(`  binary: ${item.binaryPath ?? 'missing'}`);
      console.log(`  wrapper: ${item.wrapperPath}`);
    }
  }
};
