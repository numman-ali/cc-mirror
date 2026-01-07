/**
 * Tasks command - Main router for task operations
 *
 * Usage:
 *   cc-mirror tasks [operation] [id] [options]
 *
 * Operations:
 *   list (default)  List tasks
 *   show <id>       Show task details
 *   create          Create a new task
 *   update <id>     Update a task
 *   delete <id>     Delete a task
 *   clean           Bulk cleanup
 */

import * as core from '../../core/index.js';
import type { ParsedArgs } from '../args.js';
import {
  runTasksList,
  runTasksShow,
  runTasksCreate,
  runTasksUpdate,
  runTasksDelete,
  runTasksClean,
  runTasksGraph,
  runTasksArchive,
} from './tasks/index.js';

export interface TasksCommandOptions {
  opts: ParsedArgs;
}

/**
 * Parse comma-separated IDs
 */
function parseIds(value: string | undefined): string[] | undefined {
  if (!value) return undefined;
  return value.split(',').map((s) => s.trim());
}

/**
 * Show tasks help
 */
function showTasksHelp(): void {
  console.log(`
npx cc-mirror tasks - Manage team tasks

USAGE:
  npx cc-mirror tasks [operation] [id] [options]

OPERATIONS:
  list              List tasks (default if no operation specified)
  show <id>         Show detailed task info
  create            Create a new task
  update <id>       Update an existing task
  delete <id>       Delete a task (permanent)
  archive [id]      Move task(s) to archive (preserves history)
  clean             Bulk delete tasks (permanent)
  graph             Show task dependency graph

GLOBAL OPTIONS:
  --variant <name>  Target variant (auto-detects if omitted)
  --all-variants    Show tasks across all variants
  --team <name>     Target team name
  --all             Show all teams in variant(s)
  --json            Output as JSON
  --help            Show this help

LIST OPTIONS:
  --status <s>      Filter: open, resolved, all (default: open)
  --blocked         Show only blocked tasks
  --blocking        Show only tasks blocking others
  --owner <id>      Filter by owner
  --limit <n>       Limit results (default: 50)

CREATE OPTIONS:
  --subject <text>  Task subject (required)
  --description <t> Task description
  --owner <id>      Assign owner
  --blocks <ids>    Comma-separated task IDs this task blocks
  --blocked-by <ids> Comma-separated task IDs that block this task

UPDATE OPTIONS:
  --subject <text>  Update subject
  --description <t> Update description
  --status <s>      Set status: open or resolved
  --owner <id>      Set owner (empty string to unassign)
  --add-blocks <ids>        Add blocking relationships
  --remove-blocks <ids>     Remove blocking relationships
  --add-blocked-by <ids>    Add blocked-by relationships
  --remove-blocked-by <ids> Remove blocked-by relationships
  --add-comment <text>      Add a comment
  --comment-author <id>     Comment author (default: cli)

CLEAN OPTIONS:
  --resolved        Delete all resolved tasks
  --older-than <n>  Delete tasks older than N days
  --dry-run         Preview without deleting
  --force           Skip confirmation

EXAMPLES:
  npx cc-mirror tasks                           # List open tasks
  npx cc-mirror tasks --status all              # List all tasks
  npx cc-mirror tasks show 5                    # Show task #5
  npx cc-mirror tasks create --subject "Fix bug" --description "..."
  npx cc-mirror tasks update 5 --status resolved
  npx cc-mirror tasks delete 5 --force
  npx cc-mirror tasks clean --resolved --dry-run
`);
}

/**
 * Execute the tasks command
 */
export async function runTasksCommand({ opts }: TasksCommandOptions): Promise<void> {
  const rootDir = (opts.root as string) || core.DEFAULT_ROOT;
  const positional = opts._ || [];

  // Check for help
  if (opts.help || opts.h) {
    showTasksHelp();
    return;
  }

  // Determine operation and task ID from positional args
  // positional[0] is operation (or taskId if just listing), positional[1] is taskId
  const operation = positional[0] as string | undefined;
  const taskId = positional[1] as string | undefined;

  // Common options
  const variant = opts.variant as string | undefined;
  const team = opts.team as string | undefined;
  const allVariants = Boolean(opts['all-variants']);
  const allTeams = Boolean(opts.all);
  const json = Boolean(opts.json);

  switch (operation) {
    case 'show': {
      if (!taskId) {
        console.error('Error: Task ID required. Usage: npx cc-mirror tasks show <id>');
        process.exitCode = 1;
        return;
      }
      runTasksShow({ rootDir, taskId, variant, team, json });
      break;
    }

    case 'create': {
      const subject = opts.subject as string | undefined;
      if (!subject) {
        console.error('Error: --subject required for create.');
        process.exitCode = 1;
        return;
      }
      runTasksCreate({
        rootDir,
        subject,
        description: opts.description as string | undefined,
        variant,
        team,
        owner: opts.owner as string | undefined,
        blocks: parseIds(opts.blocks as string | undefined),
        blockedBy: parseIds(opts['blocked-by'] as string | undefined),
        json,
      });
      break;
    }

    case 'update': {
      if (!taskId) {
        console.error('Error: Task ID required. Usage: npx cc-mirror tasks update <id>');
        process.exitCode = 1;
        return;
      }
      runTasksUpdate({
        rootDir,
        taskId,
        variant,
        team,
        subject: opts.subject as string | undefined,
        description: opts.description as string | undefined,
        status: opts.status as 'open' | 'resolved' | undefined,
        owner: opts.owner as string | undefined,
        addBlocks: parseIds(opts['add-blocks'] as string | undefined),
        removeBlocks: parseIds(opts['remove-blocks'] as string | undefined),
        addBlockedBy: parseIds(opts['add-blocked-by'] as string | undefined),
        removeBlockedBy: parseIds(opts['remove-blocked-by'] as string | undefined),
        addComment: opts['add-comment'] as string | undefined,
        commentAuthor: opts['comment-author'] as string | undefined,
        json,
      });
      break;
    }

    case 'delete': {
      if (!taskId) {
        console.error('Error: Task ID required. Usage: npx cc-mirror tasks delete <id>');
        process.exitCode = 1;
        return;
      }
      await runTasksDelete({
        rootDir,
        taskId,
        variant,
        team,
        force: Boolean(opts.force),
        json,
      });
      break;
    }

    case 'clean': {
      await runTasksClean({
        rootDir,
        variant,
        team,
        allVariants,
        allTeams,
        resolved: Boolean(opts.resolved),
        olderThan: opts['older-than'] !== undefined ? Number(opts['older-than']) : undefined,
        dryRun: Boolean(opts['dry-run']),
        force: Boolean(opts.force),
        json,
      });
      break;
    }

    case 'graph': {
      runTasksGraph({ rootDir, variant, team });
      break;
    }

    case 'archive': {
      await runTasksArchive({
        rootDir,
        variant,
        team,
        taskId,
        resolved: Boolean(opts.resolved),
        dryRun: Boolean(opts['dry-run']),
        force: Boolean(opts.force),
        json,
      });
      break;
    }

    case 'list':
    case undefined: {
      // Default operation is list
      runTasksList({
        rootDir,
        variant,
        team,
        allVariants,
        allTeams,
        status: (opts.status as 'open' | 'resolved' | 'all') || 'open',
        blocked: opts.blocked !== undefined ? Boolean(opts.blocked) : undefined,
        blocking: opts.blocking !== undefined ? Boolean(opts.blocking) : undefined,
        owner: opts.owner as string | undefined,
        limit: opts.limit !== undefined ? Number(opts.limit) : 50,
        json,
      });
      break;
    }

    default:
      console.error(`Unknown operation: ${operation}`);
      console.error('Run "npx cc-mirror tasks --help" for usage.');
      process.exitCode = 1;
  }
}
