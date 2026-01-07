/**
 * Task output formatters - Table and JSON output for task commands
 */

import type { Task, TaskLocation, TaskSummary } from '../../../core/tasks/index.js';
import { isBlocked } from '../../../core/tasks/index.js';

/**
 * Truncate text to fit width
 */
function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen - 3) + '...';
}

/**
 * Pad string to width
 */
function pad(text: string, width: number): string {
  return text.padEnd(width);
}

/**
 * Format a task table for console output
 */
export function formatTaskTable(tasks: Task[], location: TaskLocation, summary: TaskSummary): string {
  const lines: string[] = [];
  const { variant, team } = location;

  // Header
  lines.push(`TASKS (${variant} / ${team}) - ${summary.open} open, ${summary.resolved} resolved`);
  lines.push('─'.repeat(70));
  lines.push(`${pad('ID', 5)} ${pad('STATUS', 10)} ${pad('SUBJECT', 45)} BLOCKED`);
  lines.push('─'.repeat(70));

  // Rows
  for (const task of tasks) {
    const blocked = isBlocked(task, tasks) ? '●' : '';
    const status = task.status;
    const subject = truncate(task.subject, 45);
    lines.push(`${pad(task.id, 5)} ${pad(status, 10)} ${pad(subject, 45)} ${blocked}`);
  }

  lines.push('─'.repeat(70));
  if (summary.blocked > 0) {
    lines.push('● = blocked by unresolved tasks');
  }

  return lines.join('\n');
}

/**
 * Format tasks with multiple locations
 */
export function formatMultiLocationTaskTable(
  tasksByLocation: Array<{ location: TaskLocation; tasks: Task[]; summary: TaskSummary }>
): string {
  const sections: string[] = [];

  for (const { location, tasks, summary } of tasksByLocation) {
    sections.push(formatTaskTable(tasks, location, summary));
    sections.push('');
  }

  return sections.join('\n');
}

/**
 * Format task detail view
 */
export function formatTaskDetail(task: Task, location: TaskLocation, allTasks: Task[]): string {
  const lines: string[] = [];
  const { variant, team } = location;

  // Header
  lines.push(`TASK #${task.id} (${variant} / ${team})`);
  lines.push('═'.repeat(60));
  lines.push('');

  // Basic info
  lines.push(`Subject:     ${task.subject}`);
  lines.push(`Status:      ${task.status}`);
  lines.push(`Owner:       ${task.owner || '(unassigned)'}`);
  lines.push('');

  // Description
  if (task.description) {
    lines.push('Description:');
    const descLines = task.description.split('\n');
    for (const line of descLines.slice(0, 10)) {
      lines.push(`  ${line}`);
    }
    if (descLines.length > 10) {
      lines.push(`  ... (${descLines.length - 10} more lines)`);
    }
    lines.push('');
  }

  // Dependencies
  if (task.blockedBy.length > 0 || task.blocks.length > 0) {
    lines.push('Dependencies:');
    if (task.blockedBy.length > 0) {
      const blockedByStatus = task.blockedBy.map((id) => {
        const t = allTasks.find((t) => t.id === id);
        return t ? `#${id} (${t.status})` : `#${id} (?)`;
      });
      lines.push(`  Blocked by: ${blockedByStatus.join(', ')}`);
    }
    if (task.blocks.length > 0) {
      lines.push(`  Blocks:     ${task.blocks.map((id) => `#${id}`).join(', ')}`);
    }
    lines.push('');
  }

  // References
  if (task.references.length > 0) {
    lines.push(`References:  ${task.references.map((id) => `#${id}`).join(', ')}`);
    lines.push('');
  }

  // Comments
  if (task.comments.length > 0) {
    lines.push(`Comments (${task.comments.length}):`);
    for (const comment of task.comments) {
      lines.push(`  ┌─ ${comment.author} ${'─'.repeat(Math.max(0, 50 - comment.author.length))}`);
      const commentLines = comment.content.split('\n');
      for (const line of commentLines) {
        lines.push(`  │ ${line}`);
      }
      lines.push('  └' + '─'.repeat(55));
    }
  }

  return lines.join('\n');
}

/**
 * Format tasks as JSON
 */
export function formatTasksJson(tasks: Task[], location: TaskLocation, summary: TaskSummary): string {
  return JSON.stringify(
    {
      variant: location.variant,
      team: location.team,
      tasks,
      summary,
    },
    null,
    2
  );
}

/**
 * Format task with location as JSON
 */
export function formatTaskJson(task: Task, location: TaskLocation): string {
  return JSON.stringify(
    {
      variant: location.variant,
      team: location.team,
      task,
    },
    null,
    2
  );
}

/**
 * Format multi-location tasks as JSON
 */
export function formatMultiLocationJson(
  tasksByLocation: Array<{ location: TaskLocation; tasks: Task[]; summary: TaskSummary }>
): string {
  return JSON.stringify(
    {
      locations: tasksByLocation.map(({ location, tasks, summary }) => ({
        variant: location.variant,
        team: location.team,
        tasks,
        summary,
      })),
    },
    null,
    2
  );
}

/**
 * Format clean results
 */
export function formatCleanResults(
  results: Array<{ location: TaskLocation; deleted: string[]; dryRun: boolean }>
): string {
  const lines: string[] = [];

  for (const { location, deleted, dryRun } of results) {
    const action = dryRun ? 'Would delete' : 'Deleted';
    lines.push(`${location.variant} / ${location.team}: ${action} ${deleted.length} tasks`);
    if (deleted.length > 0 && deleted.length <= 10) {
      lines.push(`  IDs: ${deleted.join(', ')}`);
    }
  }

  return lines.join('\n');
}
