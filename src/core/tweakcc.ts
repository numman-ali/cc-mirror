import fs from 'node:fs';
import { spawn, spawnSync } from 'node:child_process';
import path from 'node:path';
import { createRequire } from 'node:module';
import { buildBrandConfig } from '../brands/index.js';
import type { MiscConfig, TweakccSettings } from '../brands/types.js';
import { TWEAKCC_VERSION } from './constants.js';
import { commandExists } from './paths.js';
import type { TweakResult } from './types.js';

export type TweakccResult = TweakResult;

const isWindows = process.platform === 'win32';
const normalizePath = (p: string) => (isWindows ? p.replace(/\\/g, '/') : p);

const require = createRequire(import.meta.url);

export const ensureTweakccConfig = (tweakDir: string, brandKey?: string | null): boolean => {
  if (!brandKey) return false;
  const configPath = path.join(tweakDir, 'config.json');
  const brandConfig = buildBrandConfig(brandKey);
  const desiredDisplay = brandConfig.settings.userMessageDisplay;

  const normalizeFormat = (format?: string) => (format || '').replace(/\s+/g, '').toLowerCase();
  const legacyFormats = new Set(['[z.ai]{}', '[minimax]{}']);
  const themeMatches = (a?: { id?: string; name?: string }, b?: { id?: string; name?: string }) =>
    (!!a?.id && !!b?.id && a.id === b.id) || (!!a?.name && !!b?.name && a.name === b.name);

  if (fs.existsSync(configPath)) {
    try {
      const existing = JSON.parse(fs.readFileSync(configPath, 'utf8')) as {
        settings?: Partial<TweakccSettings>;
      };
      let existingThemes = Array.isArray(existing.settings?.themes) ? existing.settings?.themes : [];
      const brandThemes = Array.isArray(brandConfig.settings.themes) ? brandConfig.settings.themes : [];
      const brandThemeId = brandThemes[0]?.id;
      const looksLikeLegacy = existingThemes.length === 1 && brandThemeId && existingThemes[0]?.id === brandThemeId;
      let didUpdate = false;

      if (brandKey === 'minimax' && existingThemes.length > 0) {
        const filtered = existingThemes.filter(
          (theme) =>
            theme?.id !== 'minimax-ember' &&
            theme?.id !== 'minimax-glass' &&
            theme?.id !== 'minimax-blade' &&
            theme?.name !== 'MiniMax Ember' &&
            theme?.name !== 'MiniMax Glass' &&
            theme?.name !== 'MiniMax Blade'
        );
        if (filtered.length !== existingThemes.length) {
          existingThemes = filtered;
          existing.settings = { ...existing.settings, themes: existingThemes };
          didUpdate = true;
        }
      }
      if (looksLikeLegacy) {
        existing.settings = { ...brandConfig.settings, ...existing.settings, themes: brandConfig.settings.themes };
        didUpdate = true;
      }

      const existingDisplay = existing.settings?.userMessageDisplay;
      const desiredMisc = brandConfig.settings.misc;
      if (desiredDisplay) {
        if (!existingDisplay) {
          existing.settings = { ...existing.settings, userMessageDisplay: desiredDisplay };
          didUpdate = true;
        } else {
          const existingFormat = normalizeFormat(existingDisplay.format);
          const desiredFormat = normalizeFormat(desiredDisplay.format);
          if (legacyFormats.has(existingFormat) && existingFormat !== desiredFormat) {
            existing.settings = {
              ...existing.settings,
              userMessageDisplay: { ...desiredDisplay, ...existingDisplay, format: desiredDisplay.format },
            };
            didUpdate = true;
          }
        }
      }
      if (desiredMisc) {
        const existingMisc = (existing.settings?.misc || {}) as Partial<MiscConfig>;
        const nextMisc = { ...existingMisc, ...desiredMisc };
        const miscChanged = Object.entries(desiredMisc).some(
          ([key, value]) => (existingMisc as Record<string, unknown>)[key] !== value
        );
        if (miscChanged) {
          existing.settings = { ...existing.settings, misc: nextMisc };
          didUpdate = true;
        }
      }

      if (brandThemes.length > 0) {
        const mergedThemes = [
          ...brandThemes,
          ...existingThemes.filter((existingTheme) => !brandThemes.some((theme) => themeMatches(existingTheme, theme))),
        ];
        const sameLength = mergedThemes.length === existingThemes.length;
        const sameOrder = sameLength && mergedThemes.every((theme, idx) => themeMatches(theme, existingThemes[idx]));
        if (!sameOrder) {
          existing.settings = { ...existing.settings, themes: mergedThemes };
          didUpdate = true;
        }
      }

      if (didUpdate) {
        fs.writeFileSync(configPath, JSON.stringify(existing, null, 2));
        return true;
      }
    } catch {
      // ignore malformed settings
    }
    return false;
  }

  fs.writeFileSync(configPath, JSON.stringify(brandConfig, null, 2));
  return true;
};

const resolveLocalTweakcc = (args: string[]) => {
  try {
    const entry = require.resolve('tweakcc/dist/index.js');
    return { cmd: process.execPath, args: [entry, ...args] };
  } catch {
    return null;
  }
};

export const runTweakcc = (
  tweakDir: string,
  binaryPath: string,
  stdio: 'inherit' | 'pipe' = 'inherit'
): TweakccResult => {
  const env = {
    ...process.env,
    TWEAKCC_CONFIG_DIR: normalizePath(tweakDir),
    TWEAKCC_CC_INSTALLATION_PATH: normalizePath(binaryPath),
  } as NodeJS.ProcessEnv;
  const spawnOpts = { stdio: 'pipe' as const, env, encoding: 'utf8' as const, shell: isWindows };

  const local = resolveLocalTweakcc(['--apply']);
  if (local) {
    const result = spawnSync(local.cmd, local.args, spawnOpts);
    if (stdio === 'inherit') {
      if (result.stdout) process.stdout.write(result.stdout);
      if (result.stderr) process.stderr.write(result.stderr);
    }
    return result;
  }

  if (commandExists('tweakcc')) {
    const result = spawnSync('tweakcc', ['--apply'], spawnOpts);
    if (stdio === 'inherit') {
      if (result.stdout) process.stdout.write(result.stdout);
      if (result.stderr) process.stderr.write(result.stderr);
    }
    return result;
  }

  if (!commandExists('npx')) {
    return { status: 1, stderr: 'npx not found', stdout: '' } as TweakccResult;
  }

  const result = spawnSync('npx', [`tweakcc@${TWEAKCC_VERSION}`, '--apply'], spawnOpts);
  if (stdio === 'inherit') {
    if (result.stdout) process.stdout.write(result.stdout);
    if (result.stderr) process.stderr.write(result.stderr);
  }
  return result;
};

export const launchTweakccUi = (tweakDir: string, binaryPath: string): TweakccResult => {
  const env = {
    ...process.env,
    TWEAKCC_CONFIG_DIR: normalizePath(tweakDir),
    TWEAKCC_CC_INSTALLATION_PATH: normalizePath(binaryPath),
  } as NodeJS.ProcessEnv;
  const spawnOpts = { stdio: 'inherit' as const, env, encoding: 'utf8' as const, shell: isWindows };

  const local = resolveLocalTweakcc([]);
  if (local) {
    return spawnSync(local.cmd, local.args, spawnOpts);
  }

  if (commandExists('tweakcc')) {
    return spawnSync('tweakcc', [], spawnOpts);
  }

  if (!commandExists('npx')) {
    return { status: 1, stderr: 'npx not found', stdout: '' } as TweakccResult;
  }

  return spawnSync('npx', [`tweakcc@${TWEAKCC_VERSION}`], spawnOpts);
};

const spawnTweakccAsync = (
  cmd: string,
  args: string[],
  env: NodeJS.ProcessEnv,
  stdio: 'inherit' | 'pipe'
): Promise<TweakccResult> => {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { stdio: 'pipe', env, shell: isWindows });
    let stdout = '';
    let stderr = '';
    child.stdout?.on('data', (d) => {
      stdout += d.toString();
      if (stdio === 'inherit') process.stdout.write(d);
    });
    child.stderr?.on('data', (d) => {
      stderr += d.toString();
      if (stdio === 'inherit') process.stderr.write(d);
    });
    child.on('close', (status) => {
      resolve({ status, stdout, stderr } as TweakccResult);
    });
    child.on('error', (err) => {
      resolve({ status: 1, stdout: '', stderr: err.message } as TweakccResult);
    });
  });
};

export const runTweakccAsync = async (
  tweakDir: string,
  binaryPath: string,
  stdio: 'inherit' | 'pipe' = 'inherit'
): Promise<TweakccResult> => {
  const env = {
    ...process.env,
    TWEAKCC_CONFIG_DIR: normalizePath(tweakDir),
    TWEAKCC_CC_INSTALLATION_PATH: normalizePath(binaryPath),
  } as NodeJS.ProcessEnv;

  const local = resolveLocalTweakcc(['--apply']);
  if (local) {
    return spawnTweakccAsync(local.cmd, local.args, env, stdio);
  }

  if (commandExists('tweakcc')) {
    return spawnTweakccAsync('tweakcc', ['--apply'], env, stdio);
  }

  if (!commandExists('npx')) {
    return { status: 1, stderr: 'npx not found', stdout: '' } as TweakccResult;
  }

  return spawnTweakccAsync('npx', [`tweakcc@${TWEAKCC_VERSION}`, '--apply'], env, stdio);
};
