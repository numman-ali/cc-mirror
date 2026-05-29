import fs from 'node:fs';
import { spawn, spawnSync } from 'node:child_process';
import path from 'node:path';
import type { MiscConfig, TweakccConfig, TweakccSettings } from '../brands/types.js';
import { TWEAKCC_VERSION } from './constants.js';
import { isBunCommonJsWrapperFailure, isTweakccNativeExtractionFailure } from './errors.js';
import { applyCcMirrorNativeUiHardening } from './native-ui-hardening.js';
import { readJson } from './fs.js';
import { commandExists, isWindows } from './paths.js';
import { buildManagedTweakccConfig, type TweakccProfileOptions } from './tweakcc-profile.js';
import type { TweakResult } from './types.js';

export type TweakccResult = TweakResult;
const TWEAKCC_LATEST_SPEC = 'latest';
const TWEAKCC_VERSION_SPEC_PATTERN = /^(latest|[0-9]+\.[0-9]+\.[0-9]+(?:-[0-9A-Za-z.-]+)?)$/;
const PATCHED_JS_FILENAME = 'native-claudejs-patched.js';
const VALIDATION_TIMEOUT_MS = 30_000;

export const getNpxCommand = (): string => (isWindows ? 'npx.cmd' : 'npx');

const buildNpxInvocation = (args: string[]): { cmd: string; args: string[] } => {
  const npxCmd = getNpxCommand();
  if (isWindows) {
    return { cmd: 'cmd.exe', args: ['/d', '/s', '/c', npxCmd, ...args] };
  }
  return { cmd: npxCmd, args };
};

const buildTweakccInvocation = (versionSpec: string, args: string[]) =>
  buildNpxInvocation([`tweakcc@${versionSpec}`, ...args]);

const getCombinedOutput = (result: { stderr?: string; stdout?: string }) =>
  `${result.stderr ?? ''}\n${result.stdout ?? ''}`.trim();

const buildApplyArgs = (patchIds?: string[] | null): string[] => {
  const args = ['--apply'];
  const filteredPatchIds = [...new Set((patchIds ?? []).map((id) => id.trim()).filter(Boolean))];
  if (filteredPatchIds.length > 0) {
    args.push('--patches', filteredPatchIds.join(','));
  }
  return args;
};

export const getConfiguredTweakccSpec = (): string => {
  const override = process.env.CC_MIRROR_TWEAKCC_VERSION?.trim();
  if (!override) return TWEAKCC_VERSION;
  if (!TWEAKCC_VERSION_SPEC_PATTERN.test(override)) {
    throw new Error(`Invalid CC_MIRROR_TWEAKCC_VERSION "${override}". Use "latest" or a version like "4.0.13".`);
  }
  return override;
};

const getPartialFailureWarnings = (output: string): string[] => {
  const normalized = output.toLowerCase();
  if (
    normalized.includes('customizations applied with some failures') ||
    normalized.includes('applied with some failures') ||
    normalized.includes('some failures') ||
    normalized.includes('failed patches')
  ) {
    return [
      'tweakcc reported partial patch failures; Claude Code was smoke-tested, but some optional customizations may be missing.',
    ];
  }
  return [];
};

const mergeWarnings = (...groups: Array<string[] | undefined>): string[] | undefined => {
  const warnings = [...new Set(groups.flatMap((group) => group ?? []))];
  return warnings.length > 0 ? warnings : undefined;
};

const withTweakccMetadata = (
  result: TweakccResult,
  tweakccSpec: string,
  fallbackFromTweakccSpec?: string
): TweakccResult => ({
  ...result,
  tweakccSpec,
  fallbackFromTweakccSpec,
});

const shouldRetryWithLatest = (result: TweakccResult, tweakccSpec: string) =>
  tweakccSpec !== TWEAKCC_LATEST_SPEC &&
  result.status !== 0 &&
  (result.validationStatus === 'failed' || isTweakccNativeExtractionFailure(getCombinedOutput(result)));

const writeFallbackNotice = (fromSpec: string, toSpec: string, result: TweakccResult) => {
  const reason =
    result.validationStatus === 'failed'
      ? 'produced a patched Claude Code binary that failed validation'
      : 'could not safely patch this Claude Code binary';
  process.stderr.write(`cc-mirror: tweakcc@${fromSpec} ${reason}; retrying with tweakcc@${toSpec}.\n`);
};

export const getTweakccFallbackNote = (result: TweakccResult | null | undefined): string | null => {
  const fallbackFrom = result?.fallbackFromTweakccSpec?.trim();
  const used = result?.tweakccSpec?.trim();
  if (!fallbackFrom || !used || fallbackFrom === used) return null;
  return `Pinned tweakcc@${fallbackFrom} could not safely patch this Claude Code binary; automatically retried with tweakcc@${used}.`;
};

export const getTweakccResultNotes = (result: TweakccResult | null | undefined): string[] => {
  const fallbackNote = getTweakccFallbackNote(result);
  return [...(fallbackNote ? [fallbackNote] : []), ...(result?.warnings ?? [])];
};

type RestorePoint = {
  path: string;
  mode: number;
};

const createRestorePoint = (binaryPath: string): RestorePoint | null => {
  if (!fs.existsSync(binaryPath)) return null;
  const stat = fs.statSync(binaryPath);
  const restorePath = path.join(
    path.dirname(binaryPath),
    `.cc-mirror-restore-${process.pid}-${Date.now()}-${path.basename(binaryPath)}`
  );
  fs.copyFileSync(binaryPath, restorePath);
  if (!isWindows) {
    fs.chmodSync(restorePath, stat.mode);
  }
  return { path: restorePath, mode: stat.mode };
};

const restoreBinary = (binaryPath: string, restorePoint: RestorePoint | null): string | null => {
  if (!restorePoint || !fs.existsSync(restorePoint.path)) return null;
  try {
    fs.rmSync(binaryPath, { force: true });
    fs.copyFileSync(restorePoint.path, binaryPath);
    if (!isWindows) {
      fs.chmodSync(binaryPath, restorePoint.mode);
    }
    return null;
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
};

const cleanupRestorePoint = (restorePoint: RestorePoint | null) => {
  if (!restorePoint) return;
  try {
    fs.rmSync(restorePoint.path, { force: true });
  } catch {
    // ignore cleanup failures
  }
};

const removeGeneratedPatchedJs = (tweakDir: string) => {
  try {
    fs.rmSync(path.join(tweakDir, PATCHED_JS_FILENAME), { force: true });
  } catch {
    // ignore stale generated files
  }
};

type ValidationResult = {
  ok: boolean;
  message?: string;
  stdout?: string;
  stderr?: string;
};

export const validatePatchedClaude = (tweakDir: string, binaryPath: string): ValidationResult => {
  const patchedJsPath = path.join(tweakDir, PATCHED_JS_FILENAME);
  if (fs.existsSync(patchedJsPath)) {
    const syntax = spawnSync(process.execPath, ['--check', patchedJsPath], {
      encoding: 'utf8',
      timeout: VALIDATION_TIMEOUT_MS,
    });
    const syntaxOutput = getCombinedOutput(syntax);
    if (syntax.error) {
      return { ok: false, message: `could not syntax-check patched JS: ${syntax.error.message}`, ...syntax };
    }
    if (syntax.status !== 0) {
      return {
        ok: false,
        message: `patched JS failed syntax check: ${syntaxOutput || `node --check exited ${syntax.status}`}`,
        stdout: syntax.stdout ?? '',
        stderr: syntax.stderr ?? '',
      };
    }
  }

  const version = spawnSync(binaryPath, ['--version'], {
    encoding: 'utf8',
    timeout: VALIDATION_TIMEOUT_MS,
    env: { ...process.env, CC_MIRROR_SPLASH: '0' },
  });
  const versionOutput = getCombinedOutput(version);
  if (version.error) {
    return { ok: false, message: `could not run patched Claude Code binary: ${version.error.message}`, ...version };
  }
  if (version.status !== 0 || isBunCommonJsWrapperFailure(versionOutput)) {
    return {
      ok: false,
      message: `patched Claude Code binary failed --version: ${versionOutput || `exit ${version.status}`}`,
      stdout: version.stdout ?? '',
      stderr: version.stderr ?? '',
    };
  }

  return {
    ok: true,
    stdout: version.stdout ?? '',
    stderr: version.stderr ?? '',
  };
};

const markValidationFailure = (result: TweakccResult, validation: ValidationResult): TweakccResult => {
  const message = `cc-mirror validation failed: ${validation.message ?? 'patched Claude Code binary failed validation'}`;
  return {
    ...result,
    status: result.status === 0 ? 1 : (result.status ?? 1),
    stderr: [result.stderr, validation.stderr, message].filter(Boolean).join('\n'),
    stdout: [result.stdout, validation.stdout].filter(Boolean).join('\n'),
    validationStatus: 'failed',
    validationError: message,
  };
};

const withValidationAndWarnings = (result: TweakccResult, tweakDir: string, binaryPath: string): TweakccResult => {
  const warnings = getPartialFailureWarnings(getCombinedOutput(result));
  if (result.status !== 0) {
    return { ...result, warnings: mergeWarnings(result.warnings, warnings), validationStatus: 'skipped' };
  }

  const validation = validatePatchedClaude(tweakDir, binaryPath);
  if (!validation.ok) {
    return markValidationFailure({ ...result, warnings: mergeWarnings(result.warnings, warnings) }, validation);
  }

  return { ...result, warnings: mergeWarnings(result.warnings, warnings), validationStatus: 'passed' };
};

const withRestoreFailure = (result: TweakccResult, restoreError: string | null): TweakccResult => {
  if (!restoreError) return result;
  return {
    ...result,
    status: result.status === 0 ? 1 : (result.status ?? 1),
    stderr: [result.stderr, `cc-mirror failed to restore the pristine Claude Code binary: ${restoreError}`]
      .filter(Boolean)
      .join('\n'),
  };
};

type NativeHardeningResult = {
  ok: boolean;
  changed: boolean;
  warnings?: string[];
  stdout?: string;
  stderr?: string;
};

const applyManagedNativeUiHardening = (
  tweakDir: string,
  binaryPath: string,
  tweakccSpec: string,
  stdio: 'inherit' | 'pipe'
): NativeHardeningResult => {
  const patchedJsPath = path.join(tweakDir, PATCHED_JS_FILENAME);
  if (!fs.existsSync(patchedJsPath)) {
    return { ok: true, changed: false };
  }

  const original = fs.readFileSync(patchedJsPath, 'utf8');
  const hardening = applyCcMirrorNativeUiHardening(original);

  if (!hardening.changed) {
    return { ok: true, changed: false };
  }

  fs.writeFileSync(patchedJsPath, hardening.content, 'utf8');
  const invocation = buildTweakccInvocation(tweakccSpec, ['repack', patchedJsPath, binaryPath]);
  const env = {
    ...process.env,
    TWEAKCC_CONFIG_DIR: tweakDir,
    TWEAKCC_CC_INSTALLATION_PATH: binaryPath,
  } as NodeJS.ProcessEnv;
  const result = spawnSync(invocation.cmd, invocation.args, { stdio: 'pipe', env, encoding: 'utf8' });
  if (stdio === 'inherit') {
    if (result.stdout) process.stdout.write(result.stdout);
    if (result.stderr) process.stderr.write(result.stderr);
  }

  if (result.error) {
    return {
      ok: false,
      changed: true,
      stdout: result.stdout ?? '',
      stderr: `cc-mirror native UI hardening repack failed: ${result.error.message}`,
    };
  }

  if (result.status !== 0) {
    return {
      ok: false,
      changed: true,
      stdout: result.stdout ?? '',
      stderr:
        result.stderr || `cc-mirror native UI hardening repack failed: tweakcc@${tweakccSpec} exited ${result.status}`,
    };
  }

  return {
    ok: true,
    changed: true,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
  };
};

const withManagedNativeUiHardening = (
  result: TweakccResult,
  tweakDir: string,
  binaryPath: string,
  tweakccSpec: string,
  stdio: 'inherit' | 'pipe'
): TweakccResult => {
  if (result.status !== 0) return result;

  const hardening = applyManagedNativeUiHardening(tweakDir, binaryPath, tweakccSpec, stdio);
  const next: TweakccResult = {
    ...result,
    stdout: [result.stdout, hardening.stdout].filter(Boolean).join('\n'),
    stderr: [result.stderr, hardening.stderr].filter(Boolean).join('\n'),
    warnings: mergeWarnings(result.warnings, hardening.warnings),
  };

  if (hardening.ok) return next;
  return {
    ...next,
    status: 1,
    validationStatus: 'skipped',
  };
};

export const ensureTweakccConfig = (
  tweakDir: string,
  brandKey?: string | null,
  options: TweakccProfileOptions | string = {}
): boolean => {
  const configPath = path.join(tweakDir, 'config.json');
  const profileOptions = typeof options === 'string' ? { providerKey: options } : options;
  const brandConfig = buildManagedTweakccConfig(brandKey, profileOptions);
  const desiredDisplay = brandConfig.settings.userMessageDisplay;

  const normalizeFormat = (format?: string) => (format || '').replace(/\s+/g, '').toLowerCase();
  const legacyFormats = new Set(['[z.ai]{}', '[minimax]{}']);
  const themeMatches = (a?: { id?: string; name?: string }, b?: { id?: string; name?: string }) =>
    (!!a?.id && !!b?.id && a.id === b.id) || (!!a?.name && !!b?.name && a.name === b.name);

  if (fs.existsSync(configPath)) {
    try {
      const existing = readJson<
        {
          settings?: Partial<TweakccSettings>;
        } & Omit<Partial<TweakccConfig>, 'settings'>
      >(configPath);
      if (!existing) {
        throw new Error('Malformed tweakcc config');
      }
      let existingThemes = Array.isArray(existing.settings?.themes) ? existing.settings?.themes : [];
      const brandThemes = brandKey && Array.isArray(brandConfig.settings.themes) ? brandConfig.settings.themes : [];
      const brandThemeId = brandThemes[0]?.id;
      const looksLikeLegacy = existingThemes.length === 1 && brandThemeId && existingThemes[0]?.id === brandThemeId;
      let didUpdate = false;

      if (!existing.settings) {
        existing.settings = {};
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
      const ensureMissingSetting = <K extends keyof TweakccSettings>(key: K, value: TweakccSettings[K]) => {
        if ((existing.settings ?? {})[key] !== undefined) return;
        existing.settings = { ...existing.settings, [key]: value };
        didUpdate = true;
      };

      if (existing.hidePiebaldAnnouncement !== brandConfig.hidePiebaldAnnouncement) {
        existing.hidePiebaldAnnouncement = brandConfig.hidePiebaldAnnouncement;
        didUpdate = true;
      }

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
      ensureMissingSetting('thinkingVerbs', brandConfig.settings.thinkingVerbs);
      ensureMissingSetting('thinkingStyle', brandConfig.settings.thinkingStyle);
      ensureMissingSetting('inputBox', brandConfig.settings.inputBox);
      ensureMissingSetting('toolsets', brandConfig.settings.toolsets);
      ensureMissingSetting('defaultToolset', brandConfig.settings.defaultToolset);
      ensureMissingSetting('planModeToolset', brandConfig.settings.planModeToolset);
      ensureMissingSetting('subagentModels', brandConfig.settings.subagentModels);
      ensureMissingSetting('inputPatternHighlighters', brandConfig.settings.inputPatternHighlighters);
      ensureMissingSetting('inputPatternHighlightersTestText', brandConfig.settings.inputPatternHighlightersTestText);
      if (existing.settings?.claudeMdAltNames == null) {
        existing.settings = { ...existing.settings, claudeMdAltNames: brandConfig.settings.claudeMdAltNames };
        didUpdate = true;
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

export const runTweakcc = (
  tweakDir: string,
  binaryPath: string,
  stdio: 'inherit' | 'pipe' = 'inherit',
  patchIds?: string[] | null
): TweakccResult => {
  const npxCmd = getNpxCommand();
  let primarySpec: string;
  try {
    primarySpec = getConfiguredTweakccSpec();
  } catch (error) {
    return {
      status: 1,
      stderr: error instanceof Error ? error.message : String(error),
      stdout: '',
      validationStatus: 'skipped',
    };
  }
  const env = {
    ...process.env,
    TWEAKCC_CONFIG_DIR: tweakDir,
    TWEAKCC_CC_INSTALLATION_PATH: binaryPath,
  } as NodeJS.ProcessEnv;

  if (!commandExists(npxCmd)) {
    return { status: 1, stderr: 'npx not found', stdout: '', validationStatus: 'skipped' } as TweakccResult;
  }

  const runVersion = (versionSpec: string) => {
    removeGeneratedPatchedJs(tweakDir);
    const invocation = buildTweakccInvocation(versionSpec, buildApplyArgs(patchIds));
    const result = spawnSync(invocation.cmd, invocation.args, { stdio: 'pipe', env, encoding: 'utf8' });
    if (stdio === 'inherit') {
      if (result.stdout) process.stdout.write(result.stdout);
      if (result.stderr) process.stderr.write(result.stderr);
    }
    return withValidationAndWarnings(
      withManagedNativeUiHardening(
        withTweakccMetadata(result as TweakccResult, versionSpec),
        tweakDir,
        binaryPath,
        versionSpec,
        stdio
      ),
      tweakDir,
      binaryPath
    );
  };

  const restorePoint = createRestorePoint(binaryPath);
  try {
    const primary = runVersion(primarySpec);
    if (!shouldRetryWithLatest(primary, primarySpec)) {
      return primary.status === 0 ? primary : withRestoreFailure(primary, restoreBinary(binaryPath, restorePoint));
    }

    const restoreError = restoreBinary(binaryPath, restorePoint);
    if (restoreError) {
      return withRestoreFailure(primary, restoreError);
    }

    if (stdio === 'inherit') {
      writeFallbackNotice(primarySpec, TWEAKCC_LATEST_SPEC, primary);
    }

    const fallback = withTweakccMetadata(runVersion(TWEAKCC_LATEST_SPEC), TWEAKCC_LATEST_SPEC, primarySpec);
    return fallback.status === 0 ? fallback : withRestoreFailure(fallback, restoreBinary(binaryPath, restorePoint));
  } finally {
    cleanupRestorePoint(restorePoint);
  }
};

export const launchTweakccUi = (tweakDir: string, binaryPath: string): TweakccResult => {
  const npxCmd = getNpxCommand();
  let primarySpec: string;
  try {
    primarySpec = getConfiguredTweakccSpec();
  } catch (error) {
    return {
      status: 1,
      stderr: error instanceof Error ? error.message : String(error),
      stdout: '',
      validationStatus: 'skipped',
    };
  }
  const env = {
    ...process.env,
    TWEAKCC_CONFIG_DIR: tweakDir,
    TWEAKCC_CC_INSTALLATION_PATH: binaryPath,
  } as NodeJS.ProcessEnv;

  if (!commandExists(npxCmd)) {
    return { status: 1, stderr: 'npx not found', stdout: '', validationStatus: 'skipped' } as TweakccResult;
  }

  const runVersion = (versionSpec: string) => {
    removeGeneratedPatchedJs(tweakDir);
    const invocation = buildTweakccInvocation(versionSpec, []);
    const result = spawnSync(invocation.cmd, invocation.args, { stdio: 'inherit', env, encoding: 'utf8' });
    return withValidationAndWarnings(withTweakccMetadata(result as TweakccResult, versionSpec), tweakDir, binaryPath);
  };

  const restorePoint = createRestorePoint(binaryPath);
  try {
    const primary = runVersion(primarySpec);
    if (!shouldRetryWithLatest(primary, primarySpec)) {
      return primary.status === 0 ? primary : withRestoreFailure(primary, restoreBinary(binaryPath, restorePoint));
    }

    const restoreError = restoreBinary(binaryPath, restorePoint);
    if (restoreError) {
      return withRestoreFailure(primary, restoreError);
    }

    writeFallbackNotice(primarySpec, TWEAKCC_LATEST_SPEC, primary);
    const fallback = withTweakccMetadata(runVersion(TWEAKCC_LATEST_SPEC), TWEAKCC_LATEST_SPEC, primarySpec);
    return fallback.status === 0 ? fallback : withRestoreFailure(fallback, restoreBinary(binaryPath, restorePoint));
  } finally {
    cleanupRestorePoint(restorePoint);
  }
};

// Async version for TUI progress updates
const spawnTweakccAsync = (
  cmd: string,
  args: string[],
  env: NodeJS.ProcessEnv,
  stdio: 'inherit' | 'pipe'
): Promise<TweakccResult> => {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { stdio: 'pipe', env });
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
  stdio: 'inherit' | 'pipe' = 'inherit',
  patchIds?: string[] | null
): Promise<TweakccResult> => {
  const npxCmd = getNpxCommand();
  let primarySpec: string;
  try {
    primarySpec = getConfiguredTweakccSpec();
  } catch (error) {
    return {
      status: 1,
      stderr: error instanceof Error ? error.message : String(error),
      stdout: '',
      validationStatus: 'skipped',
    };
  }
  const env = {
    ...process.env,
    TWEAKCC_CONFIG_DIR: tweakDir,
    TWEAKCC_CC_INSTALLATION_PATH: binaryPath,
  } as NodeJS.ProcessEnv;

  if (!commandExists(npxCmd)) {
    return { status: 1, stderr: 'npx not found', stdout: '', validationStatus: 'skipped' } as TweakccResult;
  }

  const runVersion = async (versionSpec: string) => {
    removeGeneratedPatchedJs(tweakDir);
    const invocation = buildTweakccInvocation(versionSpec, buildApplyArgs(patchIds));
    const result = await spawnTweakccAsync(invocation.cmd, invocation.args, env, stdio);
    return withValidationAndWarnings(
      withManagedNativeUiHardening(withTweakccMetadata(result, versionSpec), tweakDir, binaryPath, versionSpec, stdio),
      tweakDir,
      binaryPath
    );
  };

  const restorePoint = createRestorePoint(binaryPath);
  try {
    const primary = await runVersion(primarySpec);
    if (!shouldRetryWithLatest(primary, primarySpec)) {
      return primary.status === 0 ? primary : withRestoreFailure(primary, restoreBinary(binaryPath, restorePoint));
    }

    const restoreError = restoreBinary(binaryPath, restorePoint);
    if (restoreError) {
      return withRestoreFailure(primary, restoreError);
    }

    if (stdio === 'inherit') {
      writeFallbackNotice(primarySpec, TWEAKCC_LATEST_SPEC, primary);
    }

    const fallback = withTweakccMetadata(await runVersion(TWEAKCC_LATEST_SPEC), TWEAKCC_LATEST_SPEC, primarySpec);
    return fallback.status === 0 ? fallback : withRestoreFailure(fallback, restoreBinary(binaryPath, restorePoint));
  } finally {
    cleanupRestorePoint(restorePoint);
  }
};
