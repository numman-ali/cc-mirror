/**
 * useVariantUpdate Hook
 * Handles the manage-update screen business logic
 */

import { useEffect, useRef } from 'react';
import path from 'node:path';
import type { VariantMeta } from '../../core/types.js';
import type { CoreModule } from '../app.js';
import type { CompletionResult } from './types.js';
import { buildHelpLines } from './useVariantCreate.js';

export interface SelectedVariant extends VariantMeta {
  wrapperPath: string;
}

export interface UseVariantUpdateOptions {
  screen: string;
  selectedVariant: SelectedVariant | null;
  rootDir: string;
  binDir: string;
  core: CoreModule;
  setProgressLines: (updater: (prev: string[]) => string[]) => void;
  setScreen: (screen: string) => void;
  onComplete: (result: CompletionResult) => void;
}

/**
 * Build the summary lines for an updated variant
 */
export function buildUpdateSummary(
  meta: VariantMeta,
  notes: string[] | undefined,
  teamModeSupported: boolean
): string[] {
  // Build prompt pack description with provider-specific routing info
  const getPromptPackDescription = (): string => {
    if (!meta.promptPack) return 'off';
    if (meta.provider === 'zai') return 'on (zai-cli routing)';
    if (meta.provider === 'minimax') return 'on (MCP routing)';
    return 'on';
  };

  // Build team mode description
  const getTeamModeDescription = (): string => {
    if (!meta.teamModeEnabled) return 'off';
    return 'on (orchestrator skill, TodoWrite blocked)';
  };

  return [
    `Provider: ${meta.provider}`,
    `Prompt pack: ${getPromptPackDescription()}`,
    `dev-browser skill: ${meta.skillInstall ? 'on' : 'off'}`,
    ...(teamModeSupported ? [`Team mode: ${getTeamModeDescription()}`] : []),
    ...(meta.provider === 'zai' ? [`Shell env: ${meta.shellEnv ? 'write Z_AI_API_KEY' : 'manual'}`] : []),
    ...(notes || []),
  ];
}

/**
 * Build the next steps for an updated variant
 */
export function buildUpdateNextSteps(name: string, rootDir: string): string[] {
  return [
    `Run: ${name}`,
    `Tweak: cc-mirror tweak ${name}`,
    `Config: ${path.join(rootDir, name, 'config', 'settings.json')}`,
  ];
}

/**
 * Hook for handling variant update
 */
export function useVariantUpdate(options: UseVariantUpdateOptions): void {
  const { screen, selectedVariant, rootDir, binDir, core, setProgressLines, setScreen, onComplete } = options;

  // Ref to prevent concurrent execution - persists across renders
  const isRunningRef = useRef(false);

  useEffect(() => {
    if (screen !== 'manage-update') return;
    if (!selectedVariant) return;
    // Prevent concurrent execution
    if (isRunningRef.current) return;
    isRunningRef.current = true;
    let cancelled = false;

    const runUpdate = async () => {
      try {
        setProgressLines(() => []);
        const opts = {
          tweakccStdio: 'pipe' as const,
          binDir,
          onProgress: (step: string) => setProgressLines((prev) => [...prev, step]),
        };

        const result = core.updateVariantAsync
          ? await core.updateVariantAsync(rootDir, selectedVariant.name, opts)
          : core.updateVariant(rootDir, selectedVariant.name, opts);

        if (cancelled) return;

        const completion: CompletionResult = {
          doneLines: [`Updated ${selectedVariant.name}`],
          summary: buildUpdateSummary(result.meta, result.notes, core.TEAM_MODE_SUPPORTED),
          nextSteps: buildUpdateNextSteps(selectedVariant.name, rootDir),
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
        setScreen('manage-update-done');
      }
    };

    runUpdate();
    return () => {
      cancelled = true;
      isRunningRef.current = false;
    };
  }, [screen, selectedVariant, rootDir, binDir, core, setProgressLines, setScreen, onComplete]);
}
