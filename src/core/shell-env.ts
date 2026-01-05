import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { readJson } from './fs.js';

type SettingsFile = {
  env?: Record<string, string | number | undefined>;
};

export type ShellEnvStatus = 'updated' | 'skipped' | 'failed';

export interface ShellEnvResult {
  status: ShellEnvStatus;
  message?: string;
  path?: string;
}

const SETTINGS_FILE = 'settings.json';
const BLOCK_START = '# cc-mirror: Z.ai env start';
const BLOCK_END = '# cc-mirror: Z.ai env end';
const PLACEHOLDER_KEY = '<API_KEY>';

const normalizeApiKey = (value?: string | null): string | null => {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed === PLACEHOLDER_KEY) return null;
  return trimmed;
};

const isWindows = (): boolean => process.platform === 'win32';

const resolveShellProfile = (): string | null => {
  const home = os.homedir();

  // Windows PowerShell profile detection
  if (isWindows()) {
    // Check PowerShell Core profile first (pwsh)
    const pwshProfile = path.join(home, 'Documents', 'PowerShell', 'Microsoft.PowerShell_profile.ps1');
    if (fs.existsSync(pwshProfile)) return pwshProfile;

    // Check Windows PowerShell profile
    const psProfile = path.join(home, 'Documents', 'WindowsPowerShell', 'Microsoft.PowerShell_profile.ps1');
    if (fs.existsSync(psProfile)) return psProfile;

    // Default to PowerShell Core profile location (create if needed)
    return pwshProfile;
  }

  // Unix shell detection
  const shell = process.env.SHELL || '';
  const name = path.basename(shell);

  if (name === 'zsh') {
    return path.join(home, '.zshrc');
  }
  if (name === 'bash') {
    const bashrc = path.join(home, '.bashrc');
    if (fs.existsSync(bashrc)) return bashrc;
    return path.join(home, '.bash_profile');
  }

  return null;
};

const readSettingsApiKey = (configDir: string): string | null => {
  const settingsPath = path.join(configDir, SETTINGS_FILE);
  if (!fs.existsSync(settingsPath)) return null;
  const settings = readJson<SettingsFile>(settingsPath);
  const key = settings?.env?.ANTHROPIC_API_KEY;
  if (typeof key !== 'string') return null;
  return normalizeApiKey(key);
};

const renderBlock = (apiKey: string): string => {
  if (isWindows()) {
    // PowerShell syntax
    return `${BLOCK_START}\n$env:Z_AI_API_KEY = "${apiKey}"\n${BLOCK_END}\n`;
  }
  // Unix shell syntax
  return `${BLOCK_START}\nexport Z_AI_API_KEY="${apiKey}"\n${BLOCK_END}\n`;
};

const upsertBlock = (content: string, block: string) => {
  if (content.includes(BLOCK_START) && content.includes(BLOCK_END)) {
    const start = content.indexOf(BLOCK_START);
    const end = content.indexOf(BLOCK_END, start);
    const before = content.slice(0, start).trimEnd();
    const after = content.slice(end + BLOCK_END.length).trimStart();
    return `${before}\n\n${block}\n${after}`.trimEnd() + '\n';
  }
  return `${content.trimEnd()}\n\n${block}`.trimEnd() + '\n';
};

const hasZaiKeyInProfile = (content: string): boolean => {
  const lines = content.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    // Check for PowerShell syntax: $env:Z_AI_API_KEY = "..."
    if (trimmed.startsWith('$env:Z_AI_API_KEY')) {
      const equalsIndex = trimmed.indexOf('=');
      if (equalsIndex === -1) continue;
      let value = trimmed.slice(equalsIndex + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (normalizeApiKey(value)) return true;
      continue;
    }

    // Check for Unix syntax: export Z_AI_API_KEY="..."
    const exportStripped = trimmed.startsWith('export ') ? trimmed.slice(7).trim() : trimmed;
    if (!exportStripped.startsWith('Z_AI_API_KEY')) continue;
    const equalsIndex = exportStripped.indexOf('=');
    if (equalsIndex === -1) continue;
    let value = exportStripped.slice(equalsIndex + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (normalizeApiKey(value)) return true;
  }
  return false;
};

export const ensureZaiShellEnv = (opts: {
  apiKey?: string | null;
  configDir: string;
  profilePath?: string;
}): ShellEnvResult => {
  const apiKey = normalizeApiKey(opts.apiKey) || readSettingsApiKey(opts.configDir);
  if (!apiKey) {
    return { status: 'skipped', message: 'Z_AI_API_KEY not set (missing API key)' };
  }

  const envKey = normalizeApiKey(process.env.Z_AI_API_KEY);
  if (envKey) {
    return { status: 'skipped', message: 'Z_AI_API_KEY already set in environment' };
  }

  const profile = opts.profilePath ?? resolveShellProfile();
  if (!profile) {
    return { status: 'failed', message: 'Unsupported shell; set Z_AI_API_KEY manually' };
  }

  const existing = fs.existsSync(profile) ? fs.readFileSync(profile, 'utf8') : '';
  if (hasZaiKeyInProfile(existing)) {
    return { status: 'skipped', message: 'Z_AI_API_KEY already set in shell profile', path: profile };
  }
  const next = upsertBlock(existing, renderBlock(apiKey));
  if (next === existing) {
    return { status: 'skipped', message: 'Shell profile already up to date', path: profile };
  }

  // Ensure parent directories exist (especially for Windows PowerShell profiles)
  const profileDir = path.dirname(profile);
  if (!fs.existsSync(profileDir)) {
    fs.mkdirSync(profileDir, { recursive: true });
  }

  fs.writeFileSync(profile, next);
  const reloadMessage = isWindows() ? `Run: . "${profile}"` : `Run: source ${profile}`;
  return { status: 'updated', path: profile, message: reloadMessage };
};
