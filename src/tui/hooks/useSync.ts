import { useEffect, useRef } from 'react';
import path from 'node:path';
import type { SyncItem, SyncOptions, SyncResult } from '../../core/sync.js';
import { syncVariantsAsync } from '../../core/sync.js';
import type { CompletionResult } from './types.js';

export interface UseSyncOptions {
  screen: string;
  rootDir: string;
  sourceVariant: string;
  targetVariants: string[];
  syncItems: SyncItem[];
  setProgressLines: (updater: (prev: string[]) => string[]) => void;
  setScreen: (screen: string) => void;
  onComplete: (result: CompletionResult) => void;
}

const SYNC_ITEM_LABELS: Record<SyncItem, string> = {
  skills: 'Skills',
  'mcp-servers': 'MCP Servers',
  permissions: 'Permissions',
  'claude-md': 'CLAUDE.md',
};

export function useSync(options: UseSyncOptions): void {
  const { screen, rootDir, sourceVariant, targetVariants, syncItems, setProgressLines, setScreen, onComplete } =
    options;

  const isRunningRef = useRef(false);

  useEffect(() => {
    if (screen !== 'sync-running') return;
    if (isRunningRef.current) return;
    isRunningRef.current = true;
    let cancelled = false;

    const runSync = async () => {
      if (targetVariants.length === 0) {
        onComplete({
          doneLines: ['No target variants selected.'],
          summary: [],
          nextSteps: [],
          help: [],
        });
        setScreen('sync-done');
        return;
      }

      setProgressLines(() => [`Syncing from ${sourceVariant} to ${targetVariants.length} variant(s)...`, '']);

      const sourceDir = path.join(rootDir, sourceVariant);
      const targetDirs = targetVariants.map((name) => path.join(rootDir, name));

      const syncOptions: SyncOptions = {
        items: syncItems,
        createBackup: true,
      };

      try {
        const results = await syncVariantsAsync(sourceDir, targetDirs, syncOptions, (target, item) => {
          if (cancelled) return;
          setProgressLines((prev) => [...prev, `  ${target}: syncing ${SYNC_ITEM_LABELS[item]}...`]);
        });

        if (cancelled) return;

        const successCount = results.filter((r) => r.success).length;
        const failCount = results.length - successCount;

        const summary = buildSummary(results);
        const doneLines = failCount === 0 ? ['Sync completed successfully.'] : ['Sync completed with errors.'];

        const nextSteps =
          failCount > 0 ? ['Check errors above', 'Restore from backup if needed'] : ['Run any variant to verify'];

        onComplete({
          doneLines,
          summary,
          nextSteps,
          help: [`Synced: ${successCount}`, `Failed: ${failCount}`],
        });
      } catch (error) {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : String(error);
        onComplete({
          doneLines: [`Sync failed: ${message}`],
          summary: [],
          nextSteps: ['Check source variant exists', 'Verify file permissions'],
          help: [],
        });
      }

      if (!cancelled) {
        isRunningRef.current = false;
        setScreen('sync-done');
      }
    };

    runSync();
    return () => {
      cancelled = true;
      isRunningRef.current = false;
    };
  }, [screen, rootDir, sourceVariant, targetVariants, syncItems, setProgressLines, setScreen, onComplete]);
}

function buildSummary(results: SyncResult[]): string[] {
  const lines: string[] = [];

  for (const result of results) {
    const status = result.success ? '[OK]' : '[FAIL]';
    lines.push(`${status} ${result.target}`);

    for (const [item, itemResult] of Object.entries(result.itemResults)) {
      if (!itemResult) continue;
      const label = SYNC_ITEM_LABELS[item as SyncItem];
      if (itemResult.errors.length > 0) {
        lines.push(`    ${label}: ${itemResult.errors[0]}`);
      } else if (itemResult.skipped > 0) {
        lines.push(`    ${label}: skipped (not present in source)`);
      } else {
        lines.push(`    ${label}: ${itemResult.copied} copied`);
      }
    }
  }

  return lines;
}
