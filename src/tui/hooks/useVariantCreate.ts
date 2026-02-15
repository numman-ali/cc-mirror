/**
 * useVariantCreate Hook
 * Handles the create-running screen business logic
 */

import { useEffect, useRef } from 'react';
import path from 'node:path';
import type { CoreModule } from '../app.js';
import type { CreateVariantParams, CompletionResult, ModelOverrides } from './types.js';
import { detectCommandCollision } from '../../core/paths.js';

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
  install: string;
  usePromptPack: boolean;
  installSkill: boolean;
  modelOverrides: ModelOverrides;
  providerKey: string;
  shellEnv: boolean;
  notes?: string[];
}): string[] {
  const { providerLabel, install, usePromptPack, installSkill, modelOverrides, providerKey, shellEnv, notes } = params;

  // Build prompt pack description with provider-specific routing info
  const getPromptPackDescription = (): string => {
    if (!usePromptPack) return 'off';
    if (providerKey === 'zai') return 'on (zai-cli routing)';
    if (providerKey === 'minimax') return 'on (MCP routing)';
    return 'on';
  };

  return [
    `Provider: ${providerLabel}`,
    install,
    `Prompt pack: ${getPromptPackDescription()}`,
    `dev-browser skill: ${installSkill ? 'on' : 'off'}`,
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
        const collision = detectCommandCollision(params.name, params.binDir);
        if (collision.hasCollision) {
          const suggested = params.provider?.defaultVariantName || `cc${params.providerKey}`;
          const reasons: string[] = [];
          if (collision.wrapperExists) {
            reasons.push(`wrapper exists at ${collision.wrapperPath}`);
          }
          if (collision.pathConflicts && collision.resolvedCommandPath) {
            reasons.push(`'${params.name}' resolves to ${collision.resolvedCommandPath}`);
          }
          throw new Error(
            `Command name collision for "${params.name}": ${reasons.join('; ')}. ` +
              `Choose another name (suggested: "${suggested}").`
          );
        }

        setProgressLines(() => []);
        const createParams = {
          name: params.name,
          providerKey: params.providerKey || 'zai',
          baseUrl: params.baseUrl,
          apiKey: params.apiKey,
          extraEnv: params.extraEnv,
          claudeVersion: params.claudeVersion,
          modelOverrides: params.modelOverrides,
          brand: params.brandKey,
          rootDir: params.rootDir,
          binDir: params.binDir,
          noTweak: false, // Always apply tweakcc patches
          promptPack: params.usePromptPack,
          skillInstall: params.installSkill,
          shellEnv: params.shellEnv,
          skillUpdate: params.skillUpdate,
          tweakccStdio: 'pipe' as const,
          onProgress: (step: string) => setProgressLines((prev) => [...prev, step]),
        };

        const result = core.createVariantAsync
          ? await core.createVariantAsync(createParams)
          : core.createVariant(createParams);

        if (cancelled) return;

        const providerLabel = params.provider?.label || params.providerKey || 'Provider';
        const installLine = `Install: native ${result.meta.nativeVersion || params.claudeVersion} (${result.meta.claudeOrig.replace('native:', 'v')})`;
        const summary = buildCreateSummary({
          providerLabel,
          install: installLine,
          usePromptPack: params.usePromptPack,
          installSkill: params.installSkill,
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
