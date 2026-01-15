/**
 * Task create operation - Create a new task
 */

import {
  createTask,
  resolveContext,
  detectCurrentTeam,
  detectVariantFromEnv,
  resolveTasksDir,
  loadAllTasks,
  DEFAULT_VARIANT,
} from '../../../core/tasks/index.js';
import type { TasksCreateOptions } from './types.js';
import { formatTaskJson } from './output.js';

export function runTasksCreate(opts: TasksCreateOptions): void {
  const context = resolveContext({
    rootDir: opts.rootDir,
    variant: opts.variant,
    team: opts.team,
  });

  // For create, we need exactly one location
  let location = context.locations[0];

  if (!location) {
    // Tasks directory doesn't exist yet - create with detected variant/team
    const team = opts.team || detectCurrentTeam();
    const variant = opts.variant || detectVariantFromEnv() || DEFAULT_VARIANT;

    const tasksDir = resolveTasksDir(opts.rootDir, variant, team);
    location = { variant, team, tasksDir };
  }

  const task = createTask(location.tasksDir, opts.subject, opts.description || '', {
    owner: opts.owner,
    blocks: opts.blocks,
    blockedBy: opts.blockedBy,
  });

  if (opts.json) {
    const allTasks = loadAllTasks(location.tasksDir);
    console.log(formatTaskJson(task, location, allTasks));
  } else {
    console.log(`Created task #${task.id}: ${task.subject}`);
    console.log(`Location: ${location.variant} / ${location.team}`);
  }
}
