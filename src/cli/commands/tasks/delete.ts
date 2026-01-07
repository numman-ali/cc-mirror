/**
 * Task delete operation - Delete a task
 */

import { loadTask, deleteTask, resolveContext } from '../../../core/tasks/index.js';
import type { TasksDeleteOptions } from './types.js';
import * as readline from 'node:readline';

async function confirm(prompt: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

export async function runTasksDelete(opts: TasksDeleteOptions): Promise<void> {
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

  // Find and delete the task
  for (const location of context.locations) {
    const task = loadTask(location.tasksDir, opts.taskId);
    if (!task) continue;

    // Confirm deletion
    if (!opts.force) {
      const confirmed = await confirm(`Delete task #${task.id} "${task.subject}"? [y/N] `);
      if (!confirmed) {
        console.log('Cancelled.');
        return;
      }
    }

    const deleted = deleteTask(location.tasksDir, opts.taskId);
    if (deleted) {
      if (opts.json) {
        console.log(JSON.stringify({ deleted: true, taskId: opts.taskId }));
      } else {
        console.log(`Deleted task #${opts.taskId}`);
      }
    } else {
      console.error(`Failed to delete task #${opts.taskId}`);
      process.exitCode = 1;
    }
    return;
  }

  console.error(`Task #${opts.taskId} not found.`);
  process.exitCode = 1;
}
