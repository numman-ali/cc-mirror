/**
 * Context resolution - Smart variant/team detection matching wrapper.ts logic
 */

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { listVariants } from '../variants.js';
import { listTeams, getTasksDir } from './store.js';
import type { ResolvedContext, TaskLocation } from './types.js';

/**
 * Special variant name for vanilla Claude Code (no cc-mirror variant)
 * Maps to ~/.claude/tasks/<team>/ instead of ~/.cc-mirror/_default/config/tasks/<team>/
 */
export const DEFAULT_VARIANT = '_default';

/**
 * Default Claude Code config directory (vanilla installation)
 */
export const DEFAULT_CLAUDE_CONFIG_DIR = path.join(os.homedir(), '.claude');

export interface ResolveOptions {
  rootDir: string;
  variant?: string;
  team?: string;
  allVariants?: boolean;
  allTeams?: boolean;
  cwd?: string;
}

/**
 * Detect variant from CLAUDE_CONFIG_DIR environment variable
 * CLAUDE_CONFIG_DIR format: ~/.cc-mirror/<variant>/config
 */
export function detectVariantFromEnv(): string | null {
  const configDir = process.env.CLAUDE_CONFIG_DIR;
  if (!configDir) return null;

  // Extract variant name from path: ~/.cc-mirror/<variant>/config
  const normalized = configDir.replace(/\\/g, '/');
  const match = normalized.match(/\.cc-mirror\/([^/]+)\/config/);
  return match ? match[1] : null;
}

/**
 * Detect current team name from environment or working directory
 * Priority: CLAUDE_CODE_TEAM_NAME env var > git root folder name
 */
export function detectCurrentTeam(cwd?: string): string {
  // First check if CLAUDE_CODE_TEAM_NAME is set (by wrapper)
  const teamFromEnv = process.env.CLAUDE_CODE_TEAM_NAME;
  if (teamFromEnv) {
    return teamFromEnv;
  }

  const workDir = cwd || process.cwd();

  // Try to get git root, fallback to cwd
  let gitRoot: string;
  try {
    const result = spawnSync('git', ['rev-parse', '--show-toplevel'], {
      cwd: workDir,
      encoding: 'utf8',
    });
    if (result.status === 0 && result.stdout.trim()) {
      gitRoot = result.stdout.trim();
    } else {
      gitRoot = workDir;
    }
  } catch {
    gitRoot = workDir;
  }

  const folderName = path.basename(gitRoot);

  // Check for TEAM env var modifier
  const teamModifier = process.env.TEAM;
  if (teamModifier) {
    return `${folderName}-${teamModifier}`;
  }

  return folderName;
}

/**
 * List all variants that have tasks
 */
export function listVariantsWithTasks(rootDir: string): string[] {
  const variants = listVariants(rootDir);
  return variants
    .map((v) => v.name)
    .filter((name) => {
      const tasksRoot = path.join(rootDir, name, 'config', 'tasks');
      return fs.existsSync(tasksRoot);
    });
}

/**
 * Get the tasks directory for a variant/team, handling _default specially
 */
export function resolveTasksDir(rootDir: string, variant: string, team: string): string {
  if (variant === DEFAULT_VARIANT) {
    // Vanilla Claude Code: ~/.claude/tasks/<team>/
    return path.join(DEFAULT_CLAUDE_CONFIG_DIR, 'tasks', team);
  }
  // cc-mirror variant: ~/.cc-mirror/<variant>/config/tasks/<team>/
  return getTasksDir(rootDir, variant, team);
}

/**
 * List teams for a variant, handling _default specially
 */
export function resolveTeams(rootDir: string, variant: string): string[] {
  if (variant === DEFAULT_VARIANT) {
    // Check vanilla Claude Code's tasks directory
    const tasksRoot = path.join(DEFAULT_CLAUDE_CONFIG_DIR, 'tasks');
    if (!fs.existsSync(tasksRoot)) return [];
    return fs
      .readdirSync(tasksRoot, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);
  }
  return listTeams(rootDir, variant);
}

/**
 * Resolve context for task operations
 *
 * Scoping behavior:
 * - Strict team scoping: always scopes to detected team from cwd (never falls back to all teams)
 * - Strict variant scoping: uses detected variant from env, or _default for vanilla Claude Code
 * - Use allTeams/allVariants flags explicitly to see multiple teams/variants
 */
export function resolveContext(opts: ResolveOptions): ResolvedContext {
  const { rootDir, variant, team, allVariants, allTeams, cwd } = opts;
  const locations: TaskLocation[] = [];

  // Determine which variants to scan
  let variants: string[];
  if (allVariants) {
    // Include all cc-mirror variants that have tasks
    variants = listVariantsWithTasks(rootDir);
    // Also include _default if it has tasks
    const defaultTeams = resolveTeams(rootDir, DEFAULT_VARIANT);
    if (defaultTeams.length > 0 && !variants.includes(DEFAULT_VARIANT)) {
      variants.push(DEFAULT_VARIANT);
    }
  } else if (variant) {
    // Explicit variant specified
    variants = [variant];
  } else {
    // Auto-detect: env variant takes priority, otherwise use _default
    const envVariant = detectVariantFromEnv();
    variants = [envVariant || DEFAULT_VARIANT];
  }

  // For each variant, determine teams
  for (const v of variants) {
    let teams: string[];
    if (allTeams) {
      // Show all teams for this variant
      teams = resolveTeams(rootDir, v);
    } else if (team) {
      // Explicit team specified
      teams = [team];
    } else {
      // Strict scoping: always use detected team from cwd
      // This ensures we only show tasks for the current working directory
      const detectedTeam = detectCurrentTeam(cwd);
      teams = [detectedTeam];
    }

    for (const t of teams) {
      const tasksDir = resolveTasksDir(rootDir, v, t);
      if (fs.existsSync(tasksDir)) {
        locations.push({ variant: v, team: t, tasksDir });
      }
    }
  }

  return { locations };
}
