/**
 * Task archive operation - Move resolved tasks to archive folder
 */

import fs from 'node:fs';
import path from 'node:path';
import { loadAllTasks, loadTask, deleteTask, resolveContext } from '../../../core/tasks/index.js';
import type { Task } from '../../../core/tasks/index.js';
import { writeJson } from '../../../core/fs.js';

export interface TasksArchiveOptions {
  rootDir: string;
  variant?: string;
  team?: string;
  taskId?: string; // Archive specific task
  resolved?: boolean; // Archive all resolved
  dryRun?: boolean;
  force?: boolean;
  json?: boolean;
}

/**
 * Get archive directory path
 */
function getArchiveDir(tasksDir: string): string {
  return path.join(path.dirname(tasksDir), 'archive', path.basename(tasksDir));
}

/**
 * Archive a single task
 */
function archiveTask(tasksDir: string, task: Task): boolean {
  const archiveDir = getArchiveDir(tasksDir);
  fs.mkdirSync(archiveDir, { recursive: true });

  // Add archived timestamp
  const archivedTask = {
    ...task,
    archivedAt: new Date().toISOString(),
  };

  const archivePath = path.join(archiveDir, `${task.id}.json`);
  writeJson(archivePath, archivedTask);

  // Remove from active tasks
  return deleteTask(tasksDir, task.id);
}

export async function runTasksArchive(opts: TasksArchiveOptions): Promise<void> {
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

  const location = context.locations[0];

  // Archive specific task
  if (opts.taskId) {
    const task = loadTask(location.tasksDir, opts.taskId);
    if (!task) {
      console.error(`Task #${opts.taskId} not found.`);
      process.exitCode = 1;
      return;
    }

    if (opts.dryRun) {
      console.log(`Would archive task #${task.id}: ${task.subject}`);
      return;
    }

    if (archiveTask(location.tasksDir, task)) {
      if (opts.json) {
        console.log(JSON.stringify({ archived: [task.id] }));
      } else {
        console.log(`Archived task #${task.id}: ${task.subject}`);
      }
    }
    return;
  }

  // Archive all resolved tasks
  if (opts.resolved) {
    const tasks = loadAllTasks(location.tasksDir);
    const resolvedTasks = tasks.filter((t) => t.status === 'resolved');

    if (resolvedTasks.length === 0) {
      console.log('No resolved tasks to archive.');
      return;
    }

    if (opts.dryRun) {
      console.log(`Would archive ${resolvedTasks.length} resolved tasks:`);
      for (const task of resolvedTasks.slice(0, 10)) {
        console.log(`  #${task.id}: ${task.subject.slice(0, 50)}`);
      }
      if (resolvedTasks.length > 10) {
        console.log(`  ... and ${resolvedTasks.length - 10} more`);
      }
      return;
    }

    const archived: string[] = [];
    for (const task of resolvedTasks) {
      if (archiveTask(location.tasksDir, task)) {
        archived.push(task.id);
      }
    }

    if (opts.json) {
      console.log(JSON.stringify({ archived }));
    } else {
      console.log(`Archived ${archived.length} tasks to:`);
      console.log(`  ${getArchiveDir(location.tasksDir)}`);
    }
    return;
  }

  console.error('Specify --resolved to archive all resolved tasks, or provide a task ID.');
  process.exitCode = 1;
}
