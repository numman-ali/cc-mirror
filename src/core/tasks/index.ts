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
  resolveTasksDir,
  resolveTeams,
  DEFAULT_VARIANT,
  DEFAULT_CLAUDE_CONFIG_DIR,
  type ResolveOptions,
} from './resolve.js';

// Query operations
export {
  isBlocked,
  isBlocking,
  filterTasks,
  getTaskSummary,
  getOpenBlockers,
  sortTasksById,
  sortByDependency,
} from './queries.js';
