/**
 * Helpers shared between Phase 1 (TweakccStep, removed) and Phase 2
 * (BinaryPatcherStep): brand config writer, post-patch smoke test, rollback
 * note formatter, failure type. The npx-tweakcc shell-out path is gone.
 *
 * Note: file is named tweakcc.ts for historical reasons. ensureTweakccConfig
 * still writes a tweakcc-style config.json that the in-repo binary patcher
 * reads as TweakccConfig - the schema lives in src/brands/types.ts.
 */

import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { buildBrandConfig } from '../brands/index.js';
import type { MiscConfig, TweakccSettings } from '../brands/types.js';

export interface SmokeTestResult {
  ok: boolean;
  status: number | null;
  signal: NodeJS.Signals | null;
  stderr: string;
  stdout: string;
  timedOut: boolean;
  error?: string;
}

const SMOKE_TIMEOUT_MS = 5000;

/**
 * Spawn `<binaryPath> --version` and confirm it exits 0 within timeoutMs.
 *
 * Used post-patch to detect a corrupted Bun standalone binary before we
 * write the wrapper. Catches Bun-version regressions (e.g., 1.3.13 darwin
 * CJS-wrapper assertion) and unsigned-binary AMFI kills on macOS.
 */
export const smokeTestBinary = (binaryPath: string, timeoutMs: number = SMOKE_TIMEOUT_MS): SmokeTestResult => {
  let result;
  try {
    result = spawnSync(binaryPath, ['--version'], {
      timeout: timeoutMs,
      stdio: 'pipe',
      encoding: 'utf8',
      windowsHide: true,
    });
  } catch (err) {
    return {
      ok: false,
      status: null,
      signal: null,
      stderr: '',
      stdout: '',
      timedOut: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }

  const timedOut = Boolean(result.error && (result.error as NodeJS.ErrnoException).code === 'ETIMEDOUT');
  const signal = (result.signal ?? null) as NodeJS.Signals | null;
  const status = result.status ?? null;

  return {
    ok: status === 0 && !timedOut && !signal && !result.error,
    status,
    signal,
    stderr: result.stderr ?? '',
    stdout: result.stdout ?? '',
    timedOut,
    error: result.error?.message,
  };
};

export type TweakccPatchFailure =
  | { kind: 'tweakcc-failed'; output: string; tweakccSpec?: string }
  | { kind: 'smoke-failed'; smoke: SmokeTestResult; tweakccSpec?: string };

const tail3 = (text: string): string =>
  text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .slice(-3)
    .join(' | ');

export const formatRollbackNote = (fail: TweakccPatchFailure): string => {
  if (fail.kind === 'smoke-failed') {
    const reason = fail.smoke.timedOut
      ? 'binary hung'
      : fail.smoke.signal
        ? `killed by ${fail.smoke.signal}`
        : fail.smoke.error
          ? `spawn error: ${fail.smoke.error}`
          : `exit ${fail.smoke.status}`;
    const detail = tail3(fail.smoke.stderr);
    const suffix = detail ? `: ${detail}` : '';
    return `tweakcc patch corrupted the binary (${reason}${suffix}); restored pristine. Brand theme + prompt overlays disabled.`;
  }
  const detail = tail3(fail.output);
  return `tweakcc failed (${detail || 'no output'}); restored pristine. Brand theme + prompt overlays disabled.`;
};

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

      // cc-mirror does not manage tweakcc toolsets. In tweakcc v4.0.1 the toolset
      // patch can crash Claude Code interactive mode (ReferenceError: state is not defined),
      // so we proactively strip any legacy toolset config from existing variants.
      const settingsAny = (existing.settings || {}) as unknown as Record<string, unknown>;
      const hadLegacyToolsets =
        Object.hasOwn(settingsAny, 'toolsets') ||
        Object.hasOwn(settingsAny, 'defaultToolset') ||
        Object.hasOwn(settingsAny, 'planModeToolset');
      if (hadLegacyToolsets) {
        delete settingsAny.toolsets;
        delete settingsAny.defaultToolset;
        delete settingsAny.planModeToolset;
        existing.settings = settingsAny as unknown as Partial<TweakccSettings>;
        didUpdate = true;
      }

      if (brandKey === 'minimax' && existingThemes.length > 0) {
        const filtered = existingThemes.filter(
          (theme) =>
            theme?.id !== 'minimax-pulse' &&
            theme?.id !== 'minimax-ember' &&
            theme?.id !== 'minimax-glass' &&
            theme?.id !== 'minimax-blade' &&
            theme?.id !== 'minimax-nebula' &&
            theme?.name !== 'MiniMax Pulse' &&
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
        // Keep cc-mirror managed brand themes in sync even when IDs stay the same.
        // This allows palette/hardening updates to flow into existing variants.
        const brandThemeChanged = brandThemes.some((brandTheme) => {
          const existingTheme = existingThemes.find((theme) => themeMatches(theme, brandTheme));
          if (!existingTheme) return true;
          return JSON.stringify(existingTheme) !== JSON.stringify(brandTheme);
        });

        const mergedThemes = [
          ...brandThemes,
          ...existingThemes.filter((existingTheme) => !brandThemes.some((theme) => themeMatches(existingTheme, theme))),
        ];
        const sameLength = mergedThemes.length === existingThemes.length;
        const sameOrder = sameLength && mergedThemes.every((theme, idx) => themeMatches(theme, existingThemes[idx]));
        if (brandThemeChanged || !sameOrder) {
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
