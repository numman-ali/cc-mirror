/**
 * Task management module - re-exports
 */

// Types
export type {
  Task,
  TaskComment,
  TaskFilter,
  TaskLocation,
  TaskSummary,
  TaskWithLocation,
  ResolvedContext,
} from './types.js';

// Store operations
export {
  getTasksDir,
  listTaskIds,
  loadTask,
  loadAllTasks,
  saveTask,
  deleteTask,
  getNextTaskId,
  createTask,
  listTeams,
} from './store.js';

// Context resolution
export {
  detectVariantFromEnv,
  detectCurrentTeam,
  listVariantsWithTasks,
  resolveContext,
  type ResolveOptions,
} from './resolve.js';

// Query operations
export { isBlocked, isBlocking, filterTasks, getTaskSummary, sortTasksById, sortByDependency } from './queries.js';
