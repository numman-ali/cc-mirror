/**
 * Context resolution - Smart variant/team detection matching wrapper.ts logic
 */

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { listVariants } from '../variants.js';
import { listTeams } from './store.js';
import type { ResolvedContext, TaskLocation } from './types.js';

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
  const match = configDir.match(/\.cc-mirror\/([^/]+)\/config/);
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
    gitRoot = execSync('git rev-parse --show-toplevel 2>/dev/null', {
      cwd: workDir,
      encoding: 'utf8',
    }).trim();
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
 * Resolve context for task operations
 */
export function resolveContext(opts: ResolveOptions): ResolvedContext {
  const { rootDir, variant, team, allVariants, allTeams, cwd } = opts;
  const locations: TaskLocation[] = [];

  // Determine which variants to scan
  let variants: string[];
  if (allVariants) {
    variants = listVariantsWithTasks(rootDir);
  } else if (variant) {
    variants = [variant];
  } else {
    // Auto-detect from env first, then fall back to first variant with tasks
    const envVariant = detectVariantFromEnv();
    if (envVariant) {
      variants = [envVariant];
    } else {
      const variantsWithTasks = listVariantsWithTasks(rootDir);
      variants = variantsWithTasks.length > 0 ? [variantsWithTasks[0]] : [];
    }
  }

  // For each variant, determine teams
  for (const v of variants) {
    let teams: string[];
    if (allTeams) {
      teams = listTeams(rootDir, v);
    } else if (team) {
      teams = [team];
    } else {
      // Auto-detect team from cwd
      const detectedTeam = detectCurrentTeam(cwd);
      const availableTeams = listTeams(rootDir, v);
      // Only use detected team if it exists, otherwise show all teams
      if (availableTeams.includes(detectedTeam)) {
        teams = [detectedTeam];
      } else if (availableTeams.length > 0) {
        // Fall back to all teams for this variant
        teams = availableTeams;
      } else {
        teams = [];
      }
    }

    for (const t of teams) {
      const tasksDir = path.join(rootDir, v, 'config', 'tasks', t);
      if (fs.existsSync(tasksDir)) {
        locations.push({ variant: v, team: t, tasksDir });
      }
    }
  }

  return { locations };
}
