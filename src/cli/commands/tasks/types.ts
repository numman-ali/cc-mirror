/**
 * Task command types - CLI option types for task operations
 */

import type { ParsedArgs } from '../../args.js';

export interface TasksCommandOptions {
  opts: ParsedArgs;
}

export interface TasksListOptions {
  rootDir: string;
  variant?: string;
  team?: string;
  allVariants?: boolean;
  allTeams?: boolean;
  status?: 'open' | 'resolved' | 'all';
  blocked?: boolean;
  blocking?: boolean;
  owner?: string;
  limit?: number;
  json?: boolean;
}

export interface TasksShowOptions {
  rootDir: string;
  taskId: string;
  variant?: string;
  team?: string;
  json?: boolean;
}

export interface TasksCreateOptions {
  rootDir: string;
  subject: string;
  description?: string;
  variant?: string;
  team?: string;
  owner?: string;
  blocks?: string[];
  blockedBy?: string[];
  json?: boolean;
}

export interface TasksUpdateOptions {
  rootDir: string;
  taskId: string;
  variant?: string;
  team?: string;
  subject?: string;
  description?: string;
  status?: 'open' | 'resolved';
  owner?: string;
  addBlocks?: string[];
  removeBlocks?: string[];
  addBlockedBy?: string[];
  removeBlockedBy?: string[];
  addComment?: string;
  commentAuthor?: string;
  json?: boolean;
}

export interface TasksDeleteOptions {
  rootDir: string;
  taskId: string;
  variant?: string;
  team?: string;
  force?: boolean;
  json?: boolean;
}

export interface TasksCleanOptions {
  rootDir: string;
  variant?: string;
  team?: string;
  allVariants?: boolean;
  allTeams?: boolean;
  resolved?: boolean;
  olderThan?: number;
  dryRun?: boolean;
  force?: boolean;
  json?: boolean;
}
