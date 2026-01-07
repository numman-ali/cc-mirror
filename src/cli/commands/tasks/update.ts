/**
 * Task update operation - Update an existing task
 */

import { loadTask, saveTask, resolveContext } from '../../../core/tasks/index.js';
import type { TasksUpdateOptions } from './types.js';
import { formatTaskJson } from './output.js';

export function runTasksUpdate(opts: TasksUpdateOptions): void {
  const context = resolveContext({
    rootDir: opts.rootDir,
    variant: opts.variant,
    team: opts.team,
  });

  if (context.locations.length === 0) {
    console.error('No task locations found. Check variant and team settings.');
    process.exitCode = 1;
    return;
  }

  // Find the task
  for (const location of context.locations) {
    const task = loadTask(location.tasksDir, opts.taskId);
    if (!task) continue;

    // Apply updates
    if (opts.subject) task.subject = opts.subject;
    if (opts.description) task.description = opts.description;
    if (opts.status) task.status = opts.status;
    if (opts.owner !== undefined) task.owner = opts.owner || undefined;

    // Handle blocks
    if (opts.addBlocks) {
      for (const id of opts.addBlocks) {
        if (!task.blocks.includes(id)) task.blocks.push(id);
      }
    }
    if (opts.removeBlocks) {
      task.blocks = task.blocks.filter((id) => !opts.removeBlocks!.includes(id));
    }

    // Handle blockedBy
    if (opts.addBlockedBy) {
      for (const id of opts.addBlockedBy) {
        if (!task.blockedBy.includes(id)) task.blockedBy.push(id);
      }
    }
    if (opts.removeBlockedBy) {
      task.blockedBy = task.blockedBy.filter((id) => !opts.removeBlockedBy!.includes(id));
    }

    // Add comment
    if (opts.addComment) {
      task.comments.push({
        author: opts.commentAuthor || 'cli',
        content: opts.addComment,
      });
    }

    // Save
    saveTask(location.tasksDir, task);

    if (opts.json) {
      console.log(formatTaskJson(task, location));
    } else {
      console.log(`Updated task #${task.id}: ${task.subject}`);
    }
    return;
  }

  console.error(`Task #${opts.taskId} not found.`);
  process.exitCode = 1;
}
