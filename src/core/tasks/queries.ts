/**
 * Task queries - Filter and query logic for tasks
 */

import type { Task, TaskFilter, TaskSummary } from './types.js';

/**
 * Check if a task is blocked (has unresolved blockedBy)
 */
export function isBlocked(task: Task, allTasks: Task[]): boolean {
  if (task.blockedBy.length === 0) return false;

  // Create a map of task IDs to tasks for quick lookup
  const taskMap = new Map(allTasks.map((t) => [t.id, t]));

  // Task is blocked if any blockedBy task is still open
  return task.blockedBy.some((id) => {
    const blockingTask = taskMap.get(id);
    return blockingTask && blockingTask.status === 'open';
  });
}

/**
 * Check if a task is blocking others
 */
export function isBlocking(task: Task): boolean {
  return task.blocks.length > 0;
}

/**
 * Filter tasks based on criteria
 */
export function filterTasks(tasks: Task[], filter: TaskFilter, allTasks?: Task[]): Task[] {
  let filtered = [...tasks];
  const taskContext = allTasks || tasks;

  // Filter by status
  if (filter.status && filter.status !== 'all') {
    filtered = filtered.filter((t) => t.status === filter.status);
  }

  // Filter by blocked status
  if (filter.blocked !== undefined) {
    if (filter.blocked) {
      filtered = filtered.filter((t) => isBlocked(t, taskContext));
    } else {
      filtered = filtered.filter((t) => !isBlocked(t, taskContext));
    }
  }

  // Filter by blocking status
  if (filter.blocking !== undefined) {
    if (filter.blocking) {
      filtered = filtered.filter((t) => isBlocking(t));
    } else {
      filtered = filtered.filter((t) => !isBlocking(t));
    }
  }

  // Filter by ready (open + not blocked)
  if (filter.ready !== undefined) {
    if (filter.ready) {
      filtered = filtered.filter((t) => t.status === 'open' && !isBlocked(t, taskContext));
    } else {
      // Not ready means either resolved OR blocked
      filtered = filtered.filter((t) => t.status === 'resolved' || isBlocked(t, taskContext));
    }
  }

  // Filter by owner
  if (filter.owner) {
    filtered = filtered.filter((t) => t.owner === filter.owner);
  }

  // Apply limit
  if (filter.limit && filter.limit > 0) {
    filtered = filtered.slice(0, filter.limit);
  }

  return filtered;
}

/**
 * Calculate task summary statistics
 */
export function getTaskSummary(tasks: Task[]): TaskSummary {
  const open = tasks.filter((t) => t.status === 'open');
  const resolved = tasks.filter((t) => t.status === 'resolved');
  const blocked = open.filter((t) => isBlocked(t, tasks));
  const ready = open.filter((t) => !isBlocked(t, tasks));

  return {
    total: tasks.length,
    open: open.length,
    resolved: resolved.length,
    ready: ready.length,
    blocked: blocked.length,
  };
}

/**
 * Get IDs of open blockers for a task
 */
export function getOpenBlockers(task: Task, allTasks: Task[]): string[] {
  if (task.blockedBy.length === 0) return [];

  const taskMap = new Map(allTasks.map((t) => [t.id, t]));

  return task.blockedBy.filter((id) => {
    const blockingTask = taskMap.get(id);
    return blockingTask && blockingTask.status === 'open';
  });
}

/**
 * Sort tasks by ID (numeric)
 */
export function sortTasksById(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => parseInt(a.id, 10) - parseInt(b.id, 10));
}

/**
 * Sort tasks by dependency (tasks with no blockedBy first)
 */
export function sortByDependency(tasks: Task[]): Task[] {
  const sorted: Task[] = [];
  const remaining = [...tasks];
  const resolved = new Set<string>();

  // First pass: add tasks with no blockedBy
  for (let i = remaining.length - 1; i >= 0; i--) {
    if (remaining[i].blockedBy.length === 0) {
      sorted.push(remaining[i]);
      resolved.add(remaining[i].id);
      remaining.splice(i, 1);
    }
  }

  // Subsequent passes: add tasks whose blockedBy are all resolved
  let maxIterations = tasks.length;
  while (remaining.length > 0 && maxIterations > 0) {
    for (let i = remaining.length - 1; i >= 0; i--) {
      const task = remaining[i];
      const allBlockersResolved = task.blockedBy.every((id) => resolved.has(id));
      if (allBlockersResolved) {
        sorted.push(task);
        resolved.add(task.id);
        remaining.splice(i, 1);
      }
    }
    maxIterations--;
  }

  // Add any remaining tasks (circular dependencies)
  sorted.push(...remaining);

  return sorted;
}
