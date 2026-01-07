/**
 * Task types - Schema for Claude Code team mode tasks
 */

export interface TaskComment {
  author: string;
  content: string;
}

export interface Task {
  id: string;
  subject: string;
  description: string;
  status: 'open' | 'resolved';
  owner?: string;
  references: string[];
  blocks: string[];
  blockedBy: string[];
  comments: TaskComment[];
}

export interface TaskFilter {
  status?: 'open' | 'resolved' | 'all';
  blocked?: boolean;
  blocking?: boolean;
  owner?: string;
  limit?: number;
}

export interface TaskLocation {
  variant: string;
  team: string;
  tasksDir: string;
}

export interface ResolvedContext {
  locations: TaskLocation[];
}

export interface TaskSummary {
  total: number;
  open: number;
  resolved: number;
  blocked: number;
}

export interface TaskWithLocation extends Task {
  location: TaskLocation;
}
