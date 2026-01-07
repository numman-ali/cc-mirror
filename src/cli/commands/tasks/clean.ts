/**
 * Task clean operation - Bulk cleanup of tasks
 */

import fs from 'node:fs';
import path from 'node:path';
import { loadAllTasks, deleteTask, resolveContext } from '../../../core/tasks/index.js';
import type { Task } from '../../../core/tasks/index.js';
import type { TasksCleanOptions } from './types.js';
import { formatCleanResults } from './output.js';
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

/**
 * Get file modification time for a task
 */
function getTaskAge(tasksDir: string, taskId: string): number | null {
  const taskPath = path.join(tasksDir, `${taskId}.json`);
  try {
    const stats = fs.statSync(taskPath);
    const now = Date.now();
    const mtime = stats.mtime.getTime();
    return Math.floor((now - mtime) / (1000 * 60 * 60 * 24)); // days
  } catch {
    return null;
  }
}

/**
 * Filter tasks for cleanup
 */
function filterTasksForClean(tasks: Task[], tasksDir: string, opts: TasksCleanOptions): Task[] {
  let candidates = [...tasks];

  // Filter by resolved status
  if (opts.resolved) {
    candidates = candidates.filter((t) => t.status === 'resolved');
  }

  // Filter by age
  if (opts.olderThan !== undefined) {
    candidates = candidates.filter((t) => {
      const age = getTaskAge(tasksDir, t.id);
      return age !== null && age >= opts.olderThan!;
    });
  }

  return candidates;
}

export async function runTasksClean(opts: TasksCleanOptions): Promise<void> {
  const context = resolveContext({
    rootDir: opts.rootDir,
    variant: opts.variant,
    team: opts.team,
    allVariants: opts.allVariants,
    allTeams: opts.allTeams,
  });

  if (context.locations.length === 0) {
    console.log('No task locations found. Check variant and team settings.');
    return;
  }

  // Check that at least one filter is specified
  if (!opts.resolved && opts.olderThan === undefined) {
    console.error('Error: Specify at least one filter (--resolved or --older-than).');
    process.exitCode = 1;
    return;
  }

  const results: Array<{
    location: (typeof context.locations)[0];
    deleted: string[];
    dryRun: boolean;
  }> = [];

  let totalToDelete = 0;

  // Calculate what would be deleted
  for (const location of context.locations) {
    const tasks = loadAllTasks(location.tasksDir);
    const toDelete = filterTasksForClean(tasks, location.tasksDir, opts);
    totalToDelete += toDelete.length;
    results.push({
      location,
      deleted: toDelete.map((t) => t.id),
      dryRun: opts.dryRun || false,
    });
  }

  if (totalToDelete === 0) {
    console.log('No tasks match the cleanup criteria.');
    return;
  }

  // Show preview
  console.log(formatCleanResults(results));

  // If dry run, stop here
  if (opts.dryRun) {
    console.log(`\nDry run: ${totalToDelete} tasks would be deleted.`);
    return;
  }

  // Confirm deletion
  if (!opts.force) {
    const confirmed = await confirm(`\nDelete ${totalToDelete} tasks? [y/N] `);
    if (!confirmed) {
      console.log('Cancelled.');
      return;
    }
  }

  // Perform deletion
  let deletedCount = 0;
  for (const result of results) {
    for (const taskId of result.deleted) {
      if (deleteTask(result.location.tasksDir, taskId)) {
        deletedCount++;
      }
    }
  }

  if (opts.json) {
    console.log(
      JSON.stringify({
        deleted: deletedCount,
        locations: results.map((r) => ({
          variant: r.location.variant,
          team: r.location.team,
          taskIds: r.deleted,
        })),
      })
    );
  } else {
    console.log(`\nDeleted ${deletedCount} tasks.`);
  }
}
