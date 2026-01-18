/**
 * useVariantCreate Hook
 * Handles the create-running screen business logic
 */

import { useEffect, useRef } from 'react';
import path from 'node:path';
import type { CoreModule } from '../app.js';
import type { CreateVariantParams, CompletionResult, ModelOverrides } from './types.js';

export interface UseVariantCreateOptions {
  screen: string;
  params: CreateVariantParams;
  core: CoreModule;
  setProgressLines: (updater: (prev: string[]) => string[]) => void;
  setScreen: (screen: string) => void;
  onComplete: (result: CompletionResult) => void;
}

/**
 * Build the summary lines for a created variant
 */
export function buildCreateSummary(params: {
  providerLabel: string;
  npmPackage: string;
  npmVersion: string;
  usePromptPack: boolean;
  installSkill: boolean;
  enableTeamMode: boolean;
  teamModeSupported: boolean;
  modelOverrides: ModelOverrides;
  providerKey: string;
  shellEnv: boolean;
  notes?: string[];
}): string[] {
  const {
    providerLabel,
    npmPackage,
    npmVersion,
    usePromptPack,
    installSkill,
    enableTeamMode,
    teamModeSupported,
    modelOverrides,
    providerKey,
    shellEnv,
    notes,
  } = params;

  // Build prompt pack description with provider-specific routing info
  const getPromptPackDescription = (): string => {
    if (!usePromptPack) return 'off';
    if (providerKey === 'zai') return 'on (zai-cli routing)';
    if (providerKey === 'minimax') return 'on (MCP routing)';
    return 'on';
  };

  // Build team mode description
  const getTeamModeDescription = (): string => {
    if (!enableTeamMode) return 'off';
    return 'on (orchestrator skill, TodoWrite blocked)';
  };

  return [
    `Provider: ${providerLabel}`,
    `Install: npm ${npmPackage}@${npmVersion}`,
    `Prompt pack: ${getPromptPackDescription()}`,
    `dev-browser skill: ${installSkill ? 'on' : 'off'}`,
    ...(teamModeSupported ? [`Team mode: ${getTeamModeDescription()}`] : []),
    ...(modelOverrides.sonnet || modelOverrides.opus || modelOverrides.haiku
      ? [
          `Models: sonnet=${modelOverrides.sonnet || '-'}, opus=${modelOverrides.opus || '-'}, haiku=${modelOverrides.haiku || '-'}`,
        ]
      : []),
    ...(providerKey === 'zai' ? [`Shell env: ${shellEnv ? 'write Z_AI_API_KEY' : 'manual'}`] : []),
    ...(notes || []),
  ];
}

/**
 * Build the next steps for a created variant
 */
export function buildCreateNextSteps(name: string, rootDir: string): string[] {
  return [
    `Run: ${name}`,
    `Update: cc-mirror update ${name}`,
    `Tweak: cc-mirror tweak ${name}`,
    `Config: ${path.join(rootDir, name, 'config', 'settings.json')}`,
  ];
}

/**
 * Build the help lines
 */
export function buildHelpLines(): string[] {
  return ['Help: cc-mirror help', 'List: cc-mirror list', 'Doctor: cc-mirror doctor'];
}

/**
 * Hook for handling variant creation
 */
export function useVariantCreate(options: UseVariantCreateOptions): void {
  const { screen, params, core, setProgressLines, setScreen, onComplete } = options;

  // Ref to prevent concurrent execution - persists across renders
  const isRunningRef = useRef(false);

  useEffect(() => {
    if (screen !== 'create-running') return;
    // Prevent concurrent execution
    if (isRunningRef.current) return;
    isRunningRef.current = true;
    let cancelled = false;

    const runCreate = async () => {
      try {
        setProgressLines(() => []);
        const createParams = {
          name: params.name,
          providerKey: params.providerKey || 'zai',
          baseUrl: params.baseUrl,
          apiKey: params.apiKey,
          extraEnv: params.extraEnv,
          modelOverrides: params.modelOverrides,
          brand: params.brandKey,
          rootDir: params.rootDir,
          binDir: params.binDir,
          npmPackage: params.npmPackage,
          noTweak: false, // Always apply tweakcc patches
          promptPack: params.usePromptPack,
          skillInstall: params.installSkill,
          shellEnv: params.shellEnv,
          skillUpdate: params.skillUpdate,
          enableTeamMode: params.enableTeamMode,
          tweakccStdio: 'pipe' as const,
          onProgress: (step: string) => setProgressLines((prev) => [...prev, step]),
        };

        const result = core.createVariantAsync
          ? await core.createVariantAsync(createParams)
          : core.createVariant(createParams);

        if (cancelled) return;

        const providerLabel = params.provider?.label || params.providerKey || 'Provider';
        const summary = buildCreateSummary({
          providerLabel,
          npmPackage: params.npmPackage,
          npmVersion: params.npmVersion,
          usePromptPack: params.usePromptPack,
          installSkill: params.installSkill,
          enableTeamMode: params.enableTeamMode,
          teamModeSupported: core.TEAM_MODE_SUPPORTED,
          modelOverrides: params.modelOverrides,
          providerKey: params.providerKey,
          shellEnv: params.shellEnv,
          notes: result.notes,
        });

        const completion: CompletionResult = {
          doneLines: [
            `Variant created: ${params.name}`,
            `Wrapper: ${result.wrapperPath}`,
            `Config: ${path.join(params.rootDir, params.name, 'config')}`,
          ],
          summary,
          nextSteps: buildCreateNextSteps(params.name, params.rootDir),
          help: buildHelpLines(),
        };

        onComplete(completion);
      } catch (error) {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : String(error);
        onComplete({
          doneLines: [`Failed: ${message}`],
          summary: [],
          nextSteps: [],
          help: [],
        });
      }
      if (!cancelled) {
        isRunningRef.current = false;
        setScreen('create-done');
      }
    };

    runCreate();
    return () => {
      cancelled = true;
      isRunningRef.current = false;
    };
  }, [screen, params, core, setProgressLines, setScreen, onComplete]);
}
