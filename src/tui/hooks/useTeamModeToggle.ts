/**
 * useTeamModeToggle Hook
 * Handles toggling team mode on/off for a variant
 */

import { useEffect } from 'react';
import type { CoreModule } from '../app.js';
import type { CompletionResult } from './types.js';
import type { SelectedVariant } from './useVariantUpdate.js';

export interface UseTeamModeToggleOptions {
  screen: string;
  selectedVariant: SelectedVariant | null;
  rootDir: string;
  binDir: string;
  core: CoreModule;
  setProgressLines: (updater: (prev: string[]) => string[]) => void;
  setScreen: (screen: string) => void;
  onComplete: (result: CompletionResult) => void;
  refreshVariants: () => void;
}

/**
 * Hook for handling team mode toggle
 */
export function useTeamModeToggle(options: UseTeamModeToggleOptions): void {
  const { screen, selectedVariant, rootDir, binDir, core, setProgressLines, setScreen, onComplete, refreshVariants } =
    options;

  useEffect(() => {
    if (screen !== 'manage-team-mode') return;
    if (!selectedVariant) return;
    let cancelled = false;

    const runToggle = async () => {
      try {
        setProgressLines(() => []);
        const isCurrentlyEnabled = selectedVariant.teamModeEnabled;
        const action = isCurrentlyEnabled ? 'Disabling' : 'Enabling';

        setProgressLines((prev) => [...prev, `${action} team mode...`]);

        const opts = {
          tweakccStdio: 'pipe' as const,
          binDir,
          settingsOnly: true, // Don't reinstall npm package
          enableTeamMode: !isCurrentlyEnabled,
          disableTeamMode: isCurrentlyEnabled,
          onProgress: (step: string) => setProgressLines((prev) => [...prev, step]),
        };

        const result = core.updateVariantAsync
          ? await core.updateVariantAsync(rootDir, selectedVariant.name, opts)
          : core.updateVariant(rootDir, selectedVariant.name, opts);

        if (cancelled) return;

        const newStatus = result.meta.teamModeEnabled ? 'enabled' : 'disabled';
        const completion: CompletionResult = {
          doneLines: [`Team mode ${newStatus} for ${selectedVariant.name}`],
          summary: [...(result.notes || [])],
          nextSteps: [`Run: ${selectedVariant.name}`],
          help: ['Team mode adds TaskCreate, TaskGet, TaskUpdate, TaskList tools for multi-agent coordination'],
        };

        onComplete(completion);
        refreshVariants(); // Refresh the variants list to update the UI
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
      if (!cancelled) setScreen('manage-team-mode-done');
    };

    runToggle();
    return () => {
      cancelled = true;
    };
  }, [screen, selectedVariant, rootDir, binDir, core, setProgressLines, setScreen, onComplete, refreshVariants]);
}
