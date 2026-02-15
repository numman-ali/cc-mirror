import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';

export const isWindows = process.platform === 'win32';

const VARIANT_NAME_PATTERN = /^[A-Za-z0-9_][A-Za-z0-9._-]*$/;

export const assertValidVariantName = (name: string): void => {
  if (!name || !VARIANT_NAME_PATTERN.test(name)) {
    throw new Error(
      `Invalid variant name "${name}". Use letters, numbers, underscores, dots, and dashes (no spaces or slashes).`
    );
  }
};

export const expandTilde = (input?: string): string | undefined => {
  if (!input) return input;
  if (input === '~') return os.homedir();
  if (input.startsWith('~/')) return path.join(os.homedir(), input.slice(2));
  return input;
};

const normalizeWrapperBaseName = (name: string): string => {
  if (!isWindows) return name;
  return name.toLowerCase().endsWith('.cmd') ? name.slice(0, -4) : name;
};

export const getWrapperFilename = (name: string): string =>
  isWindows ? `${normalizeWrapperBaseName(name)}.cmd` : name;

export const getWrapperScriptFilename = (name: string): string => `${normalizeWrapperBaseName(name)}.mjs`;

export const getWrapperPath = (binDir: string, name: string): string => path.join(binDir, getWrapperFilename(name));

export const getWrapperScriptPath = (binDir: string, name: string): string =>
  path.join(binDir, getWrapperScriptFilename(name));

export const commandExists = (cmd: string): boolean => {
  const result = spawnSync(process.platform === 'win32' ? 'where' : 'which', [cmd], {
    encoding: 'utf8',
  });
  return result.status === 0 && result.stdout.trim().length > 0;
};

export interface CommandCollisionCheck {
  wrapperPath: string;
  wrapperExists: boolean;
  binDirOnPath: boolean;
  resolvedCommandPath: string | null;
  pathConflicts: boolean;
  hasCollision: boolean;
}

const normalizeFsPath = (input: string): string => {
  const normalized = path.normalize(input);
  return isWindows ? normalized.toLowerCase() : normalized;
};

export const resolveCommandPath = (cmd: string): string | null => {
  const result = spawnSync(process.platform === 'win32' ? 'where' : 'which', [cmd], {
    encoding: 'utf8',
  });
  if (result.status !== 0 || !result.stdout) return null;
  const firstLine = result.stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean);
  return firstLine || null;
};

export const detectCommandCollision = (name: string, binDir: string): CommandCollisionCheck => {
  const resolvedBin = expandTilde(binDir) ?? binDir;
  const wrapperPath = getWrapperPath(resolvedBin, name);
  const wrapperExists = fs.existsSync(wrapperPath);
  const pathEntries = (process.env.PATH || '')
    .split(path.delimiter)
    .map((entry) => entry.trim())
    .filter(Boolean);
  const normalizedResolvedBin = normalizeFsPath(resolvedBin);
  const binDirOnPath = pathEntries.some((entry) => normalizeFsPath(entry) === normalizedResolvedBin);
  const resolvedCommandPath = resolveCommandPath(name);
  const pathConflicts = Boolean(
    binDirOnPath && resolvedCommandPath && normalizeFsPath(resolvedCommandPath) !== normalizeFsPath(wrapperPath)
  );
  return {
    wrapperPath,
    wrapperExists,
    binDirOnPath,
    resolvedCommandPath,
    pathConflicts,
    hasCollision: wrapperExists || pathConflicts,
  };
};
