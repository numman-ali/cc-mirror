import fs from 'node:fs';

export const MAX_JSON_BYTES = 1024 * 1024;

const POLLUTION_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

export const safeJsonParse = <T>(text: string): T | null => {
  try {
    return JSON.parse(text, (key: string, value: unknown) => {
      if (POLLUTION_KEYS.has(key)) {
        return undefined;
      }
      return value;
    }) as T;
  } catch {
    return null;
  }
};

export const ensureDir = (dir: string) => {
  fs.mkdirSync(dir, { recursive: true });
};

export const writeJson = <T>(filePath: string, data: T) => {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

export const readJson = <T>(filePath: string): T | null => {
  try {
    const stats = fs.statSync(filePath);
    if (stats.size > MAX_JSON_BYTES) {
      return null;
    }

    return safeJsonParse<T>(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
};
