import fs from 'node:fs';
import path from 'node:path';
import { ensureDir, readJson, writeJson } from './fs.js';

export type SyncItem = 'skills' | 'mcp-servers' | 'permissions' | 'claude-md';

export interface SyncOptions {
  items: SyncItem[];
  createBackup: boolean;
}

export interface SyncItemResult {
  copied: number;
  skipped: number;
  errors: string[];
}

export interface SyncResult {
  target: string;
  success: boolean;
  backupPath?: string;
  itemResults: Partial<Record<SyncItem, SyncItemResult>>;
}

type ClaudeConfig = {
  mcpServers?: Record<string, McpServerConfig>;
  [key: string]: unknown;
};

type McpServerConfig = {
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  url?: string;
  headers?: string[];
  transport?: string;
};

type SettingsFile = {
  env?: Record<string, string | number | undefined>;
  permissions?: {
    allow?: string[];
    ask?: string[];
    deny?: string[];
  };
  [key: string]: unknown;
};

const PROVIDER_ENV_PREFIXES = [
  'ANTHROPIC_',
  'CC_MIRROR_',
  'TWEAKCC_',
  'CLAUDE_CODE_TEAM_',
  'CLAUDE_CODE_AGENT_',
  'Z_AI_',
  'MINIMAX_',
  'OPENROUTER_',
];

const BACKUP_DIR_NAME = 'config.backup';
const CLAUDE_CONFIG_FILE = '.claude.json';
const SETTINGS_FILE = 'settings.json';
const SKILLS_DIR = 'skills';
const CLAUDE_MD_FILE = 'CLAUDE.md';

export const createConfigBackup = (variantDir: string): string => {
  const configDir = path.join(variantDir, 'config');
  const backupDir = path.join(variantDir, BACKUP_DIR_NAME);

  if (!fs.existsSync(configDir)) {
    throw new Error(`Config directory not found: ${configDir}`);
  }

  if (fs.existsSync(backupDir)) {
    fs.rmSync(backupDir, { recursive: true, force: true });
  }

  fs.cpSync(configDir, backupDir, { recursive: true });

  const metaPath = path.join(backupDir, '.backup-meta.json');
  writeJson(metaPath, {
    createdAt: new Date().toISOString(),
    source: 'sync',
  });

  return backupDir;
};

export const restoreConfigBackup = (variantDir: string): boolean => {
  const configDir = path.join(variantDir, 'config');
  const backupDir = path.join(variantDir, BACKUP_DIR_NAME);

  if (!fs.existsSync(backupDir)) {
    return false;
  }

  if (fs.existsSync(configDir)) {
    fs.rmSync(configDir, { recursive: true, force: true });
  }

  fs.cpSync(backupDir, configDir, { recursive: true });

  const metaPath = path.join(configDir, '.backup-meta.json');
  if (fs.existsSync(metaPath)) {
    fs.unlinkSync(metaPath);
  }

  return true;
};

const isProviderEnvKey = (key: string): boolean => {
  return PROVIDER_ENV_PREFIXES.some((prefix) => key.startsWith(prefix));
};

const syncSkills = (sourceConfigDir: string, targetConfigDir: string): SyncItemResult => {
  const result: SyncItemResult = { copied: 0, skipped: 0, errors: [] };
  const sourceSkillsDir = path.join(sourceConfigDir, SKILLS_DIR);
  const targetSkillsDir = path.join(targetConfigDir, SKILLS_DIR);

  if (!fs.existsSync(sourceSkillsDir)) {
    result.skipped = 1;
    return result;
  }

  try {
    ensureDir(targetSkillsDir);

    const skills = fs.readdirSync(sourceSkillsDir, { withFileTypes: true }).filter((e) => e.isDirectory());

    for (const skill of skills) {
      const sourceSkillPath = path.join(sourceSkillsDir, skill.name);
      const targetSkillPath = path.join(targetSkillsDir, skill.name);

      try {
        if (fs.existsSync(targetSkillPath)) {
          fs.rmSync(targetSkillPath, { recursive: true, force: true });
        }
        fs.cpSync(sourceSkillPath, targetSkillPath, { recursive: true });
        result.copied++;
      } catch (err) {
        result.errors.push(`Failed to copy skill ${skill.name}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  } catch (err) {
    result.errors.push(`Failed to sync skills: ${err instanceof Error ? err.message : String(err)}`);
  }

  return result;
};

const syncMcpServers = (sourceConfigDir: string, targetConfigDir: string): SyncItemResult => {
  const result: SyncItemResult = { copied: 0, skipped: 0, errors: [] };
  const sourceConfigPath = path.join(sourceConfigDir, CLAUDE_CONFIG_FILE);
  const targetConfigPath = path.join(targetConfigDir, CLAUDE_CONFIG_FILE);

  const sourceConfig = readJson<ClaudeConfig>(sourceConfigPath);
  if (!sourceConfig?.mcpServers || Object.keys(sourceConfig.mcpServers).length === 0) {
    result.skipped = 1;
    return result;
  }

  try {
    const targetConfig = readJson<ClaudeConfig>(targetConfigPath) || {};
    const existingServers = targetConfig.mcpServers || {};

    const mergedServers = { ...existingServers };
    for (const [name, config] of Object.entries(sourceConfig.mcpServers)) {
      mergedServers[name] = config;
      result.copied++;
    }

    const updatedConfig: ClaudeConfig = {
      ...targetConfig,
      mcpServers: mergedServers,
    };

    writeJson(targetConfigPath, updatedConfig);
  } catch (err) {
    result.errors.push(`Failed to sync MCP servers: ${err instanceof Error ? err.message : String(err)}`);
  }

  return result;
};

const syncPermissions = (sourceConfigDir: string, targetConfigDir: string): SyncItemResult => {
  const result: SyncItemResult = { copied: 0, skipped: 0, errors: [] };
  const sourceSettingsPath = path.join(sourceConfigDir, SETTINGS_FILE);
  const targetSettingsPath = path.join(targetConfigDir, SETTINGS_FILE);

  const sourceSettings = readJson<SettingsFile>(sourceSettingsPath);
  if (!sourceSettings?.permissions) {
    result.skipped = 1;
    return result;
  }

  try {
    const targetSettings = readJson<SettingsFile>(targetSettingsPath) || {};

    const mergedPermissions = {
      allow: sourceSettings.permissions.allow || [],
      ask: sourceSettings.permissions.ask || [],
      deny: sourceSettings.permissions.deny || [],
    };

    const targetEnv = targetSettings.env || {};
    const sourceEnv = sourceSettings.env || {};

    const mergedEnv: Record<string, string | number | undefined> = { ...targetEnv };
    for (const [key, value] of Object.entries(sourceEnv)) {
      if (!isProviderEnvKey(key)) {
        mergedEnv[key] = value;
        result.copied++;
      }
    }

    const updatedSettings: SettingsFile = {
      ...targetSettings,
      env: mergedEnv,
      permissions: mergedPermissions,
    };

    writeJson(targetSettingsPath, updatedSettings);
  } catch (err) {
    result.errors.push(`Failed to sync permissions: ${err instanceof Error ? err.message : String(err)}`);
  }

  return result;
};

const syncClaudeMd = (sourceConfigDir: string, targetConfigDir: string): SyncItemResult => {
  const result: SyncItemResult = { copied: 0, skipped: 0, errors: [] };
  const sourcePath = path.join(sourceConfigDir, CLAUDE_MD_FILE);
  const targetPath = path.join(targetConfigDir, CLAUDE_MD_FILE);

  if (!fs.existsSync(sourcePath)) {
    result.skipped = 1;
    return result;
  }

  try {
    fs.copyFileSync(sourcePath, targetPath);
    result.copied = 1;
  } catch (err) {
    result.errors.push(`Failed to sync CLAUDE.md: ${err instanceof Error ? err.message : String(err)}`);
  }

  return result;
};

export const syncVariants = (sourceDir: string, targetDirs: string[], options: SyncOptions): SyncResult[] => {
  const results: SyncResult[] = [];
  const sourceConfigDir = path.join(sourceDir, 'config');

  if (!fs.existsSync(sourceConfigDir)) {
    throw new Error(`Source config directory not found: ${sourceConfigDir}`);
  }

  for (const targetDir of targetDirs) {
    const result: SyncResult = {
      target: path.basename(targetDir),
      success: true,
      itemResults: {},
    };

    const targetConfigDir = path.join(targetDir, 'config');

    if (options.createBackup) {
      try {
        result.backupPath = createConfigBackup(targetDir);
      } catch (err) {
        result.success = false;
        const backupErrorMessage = `Backup failed: ${err instanceof Error ? err.message : String(err)}`;
        for (const item of options.items) {
          result.itemResults[item] = {
            copied: 0,
            skipped: 0,
            errors: [backupErrorMessage],
          };
        }
        results.push(result);
        continue;
      }
    }

    for (const item of options.items) {
      switch (item) {
        case 'skills':
          result.itemResults[item] = syncSkills(sourceConfigDir, targetConfigDir);
          break;
        case 'mcp-servers':
          result.itemResults[item] = syncMcpServers(sourceConfigDir, targetConfigDir);
          break;
        case 'permissions':
          result.itemResults[item] = syncPermissions(sourceConfigDir, targetConfigDir);
          break;
        case 'claude-md':
          result.itemResults[item] = syncClaudeMd(sourceConfigDir, targetConfigDir);
          break;
      }

      const itemResult = result.itemResults[item];
      if (itemResult && itemResult.errors.length > 0) {
        result.success = false;
      }
    }

    results.push(result);
  }

  return results;
};

export const syncVariantsAsync = async (
  sourceDir: string,
  targetDirs: string[],
  options: SyncOptions,
  onProgress?: (target: string, item: SyncItem) => void
): Promise<SyncResult[]> => {
  const results: SyncResult[] = [];
  const sourceConfigDir = path.join(sourceDir, 'config');

  if (!fs.existsSync(sourceConfigDir)) {
    throw new Error(`Source config directory not found: ${sourceConfigDir}`);
  }

  for (const targetDir of targetDirs) {
    const result: SyncResult = {
      target: path.basename(targetDir),
      success: true,
      itemResults: {},
    };

    const targetConfigDir = path.join(targetDir, 'config');

    if (options.createBackup) {
      try {
        result.backupPath = createConfigBackup(targetDir);
      } catch (err) {
        result.success = false;
        const backupErrorMessage = `Backup failed: ${err instanceof Error ? err.message : String(err)}`;
        for (const item of options.items) {
          result.itemResults[item] = {
            copied: 0,
            skipped: 0,
            errors: [backupErrorMessage],
          };
        }
        results.push(result);
        continue;
      }
    }

    for (const item of options.items) {
      onProgress?.(result.target, item);
      await new Promise((resolve) => setImmediate(resolve));

      switch (item) {
        case 'skills':
          result.itemResults[item] = syncSkills(sourceConfigDir, targetConfigDir);
          break;
        case 'mcp-servers':
          result.itemResults[item] = syncMcpServers(sourceConfigDir, targetConfigDir);
          break;
        case 'permissions':
          result.itemResults[item] = syncPermissions(sourceConfigDir, targetConfigDir);
          break;
        case 'claude-md':
          result.itemResults[item] = syncClaudeMd(sourceConfigDir, targetConfigDir);
          break;
      }

      const itemResult = result.itemResults[item];
      if (itemResult && itemResult.errors.length > 0) {
        result.success = false;
      }
    }

    results.push(result);
  }

  return results;
};
