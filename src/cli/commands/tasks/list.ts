/**
 * Task list operation - List tasks with filtering
 */

import { loadAllTasks, filterTasks, getTaskSummary, resolveContext, sortTasksById } from '../../../core/tasks/index.js';
import type { TasksListOptions } from './types.js';
import { formatTaskTable, formatMultiLocationTaskTable, formatTasksJson, formatMultiLocationJson } from './output.js';

export function runTasksList(opts: TasksListOptions): void {
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

  const tasksByLocation = context.locations.map((location) => {
    const allTasks = loadAllTasks(location.tasksDir);
    const filteredTasks = filterTasks(
      allTasks,
      {
        status: opts.status || 'open',
        blocked: opts.blocked,
        blocking: opts.blocking,
        ready: opts.ready,
        owner: opts.owner,
        limit: opts.limit,
      },
      allTasks
    );
    const sortedTasks = sortTasksById(filteredTasks);
    const summary = getTaskSummary(allTasks);
    return { location, tasks: sortedTasks, allTasks, summary };
  });

  // Output
  if (opts.json) {
    if (tasksByLocation.length === 1) {
      const { location, tasks, allTasks, summary } = tasksByLocation[0];
      console.log(formatTasksJson(tasks, location, summary, allTasks));
    } else {
      console.log(formatMultiLocationJson(tasksByLocation));
    }
  } else {
    if (tasksByLocation.length === 1) {
      const { location, tasks, summary } = tasksByLocation[0];
      console.log(formatTaskTable(tasks, location, summary));
    } else {
      console.log(formatMultiLocationTaskTable(tasksByLocation));
    }
  }
}
