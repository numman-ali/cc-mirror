/**
 * Task show operation - Show detailed task info
 */

import { loadTask, loadAllTasks, resolveContext } from '../../../core/tasks/index.js';
import type { TasksShowOptions } from './types.js';
import { formatTaskDetail, formatTaskJson } from './output.js';

export function runTasksShow(opts: TasksShowOptions): void {
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

  // Search for the task in all locations
  for (const location of context.locations) {
    const task = loadTask(location.tasksDir, opts.taskId);
    if (task) {
      const allTasks = loadAllTasks(location.tasksDir);
      if (opts.json) {
        console.log(formatTaskJson(task, location, allTasks));
      } else {
        console.log(formatTaskDetail(task, location, allTasks));
      }
      return;
    }
  }

  console.error(`Task #${opts.taskId} not found.`);
  process.exitCode = 1;
}
