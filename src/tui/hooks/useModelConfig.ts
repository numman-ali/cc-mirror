/**
 * useModelConfig Hook
 * Handles the manage-models-saving screen business logic
 */

import { useEffect, useRef } from 'react';
import type { CoreModule } from '../app.js';
import type { CompletionResult } from './types.js';
import type { SelectedVariant } from './useVariantUpdate.js';

export interface UseModelConfigOptions {
  screen: string;
  selectedVariant: SelectedVariant | null;
  rootDir: string;
  binDir: string;
  modelOpus: string;
  modelSonnet: string;
  modelHaiku: string;
  core: CoreModule;
  setProgressLines: (updater: (prev: string[]) => string[]) => void;
  setScreen: (screen: string) => void;
  onComplete: (result: CompletionResult) => void;
}

/**
 * Hook for handling model configuration saving
 */
export function useModelConfig(options: UseModelConfigOptions): void {
  const {
    screen,
    selectedVariant,
    rootDir,
    binDir,
    modelOpus,
    modelSonnet,
    modelHaiku,
    core,
    setProgressLines,
    setScreen,
    onComplete,
  } = options;

  // Ref to prevent concurrent execution - persists across renders
  const isRunningRef = useRef(false);

  useEffect(() => {
    if (screen !== 'manage-models-saving') return;
    if (!selectedVariant) return;
    // Prevent concurrent execution
    if (isRunningRef.current) return;
    isRunningRef.current = true;
    let cancelled = false;

    const saveModels = async () => {
      try {
        setProgressLines(() => ['Saving model configuration...']);
        const opts = {
          tweakccStdio: 'pipe' as const,
          binDir,
          settingsOnly: true, // Skip Claude Code reinstall, just update settings.json
          noTweak: true, // Don't re-run tweakcc patches
          modelOverrides: {
            opus: modelOpus.trim() || undefined,
            sonnet: modelSonnet.trim() || undefined,
            haiku: modelHaiku.trim() || undefined,
          },
          onProgress: (step: string) => setProgressLines((prev) => [...prev, step]),
        };

        if (core.updateVariantAsync) {
          await core.updateVariantAsync(rootDir, selectedVariant.name, opts);
        } else {
          core.updateVariant(rootDir, selectedVariant.name, opts);
        }

        if (cancelled) return;

        const completion: CompletionResult = {
          doneLines: [`Updated model mapping for ${selectedVariant.name}`],
          summary: [
            `Opus: ${modelOpus.trim() || '(not set)'}`,
            `Sonnet: ${modelSonnet.trim() || '(not set)'}`,
            `Haiku: ${modelHaiku.trim() || '(not set)'}`,
          ],
          nextSteps: [`Run: ${selectedVariant.name}`, 'Models are saved in settings.json'],
          help: ['Use "Update" to refresh binary while keeping models'],
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
        setScreen('manage-models-done');
      }
    };

    saveModels();
    return () => {
      cancelled = true;
      isRunningRef.current = false;
    };
  }, [
    screen,
    selectedVariant,
    rootDir,
    binDir,
    modelOpus,
    modelSonnet,
    modelHaiku,
    core,
    setProgressLines,
    setScreen,
    onComplete,
  ]);
}
