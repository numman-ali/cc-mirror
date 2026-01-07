/**
 * Task create operation - Create a new task
 */

import { createTask, resolveContext, detectCurrentTeam, getTasksDir } from '../../../core/tasks/index.js';
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
    // Try to create with detected team
    const team = opts.team || detectCurrentTeam();
    const variant = opts.variant;

    if (!variant) {
      console.error('No variant specified. Use --variant to specify a variant.');
      process.exitCode = 1;
      return;
    }

    const tasksDir = getTasksDir(opts.rootDir, variant, team);
    location = { variant, team, tasksDir };
  }

  const task = createTask(location.tasksDir, opts.subject, opts.description || '', {
    owner: opts.owner,
    blocks: opts.blocks,
    blockedBy: opts.blockedBy,
  });

  if (opts.json) {
    console.log(formatTaskJson(task, location));
  } else {
    console.log(`Created task #${task.id}: ${task.subject}`);
    console.log(`Location: ${location.variant} / ${location.team}`);
  }
}
