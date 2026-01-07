/**
 * Task store - CRUD operations for task files
 */

import fs from 'node:fs';
import path from 'node:path';
import { readJson, writeJson } from '../fs.js';
import type { Task } from './types.js';

/**
 * Get the tasks directory for a variant/team
 */
export function getTasksDir(rootDir: string, variant: string, team: string): string {
  return path.join(rootDir, variant, 'config', 'tasks', team);
}

/**
 * List all task file IDs in a directory
 */
export function listTaskIds(tasksDir: string): string[] {
  if (!fs.existsSync(tasksDir)) return [];
  return fs
    .readdirSync(tasksDir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => f.replace('.json', ''))
    .sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
}

/**
 * Load a single task by ID
 */
export function loadTask(tasksDir: string, id: string): Task | null {
  const taskPath = path.join(tasksDir, `${id}.json`);
  if (!fs.existsSync(taskPath)) return null;
  return readJson<Task>(taskPath);
}

/**
 * Load all tasks from a directory
 */
export function loadAllTasks(tasksDir: string): Task[] {
  const ids = listTaskIds(tasksDir);
  return ids.map((id) => loadTask(tasksDir, id)).filter((task): task is Task => task !== null);
}

/**
 * Save a task to disk
 */
export function saveTask(tasksDir: string, task: Task): void {
  fs.mkdirSync(tasksDir, { recursive: true });
  const taskPath = path.join(tasksDir, `${task.id}.json`);
  writeJson(taskPath, task);
}

/**
 * Delete a task by ID
 */
export function deleteTask(tasksDir: string, id: string): boolean {
  const taskPath = path.join(tasksDir, `${id}.json`);
  if (!fs.existsSync(taskPath)) return false;
  fs.unlinkSync(taskPath);
  return true;
}

/**
 * Get the next available task ID
 */
export function getNextTaskId(tasksDir: string): string {
  const ids = listTaskIds(tasksDir);
  if (ids.length === 0) return '1';
  const maxId = Math.max(...ids.map((id) => parseInt(id, 10)));
  return String(maxId + 1);
}

/**
 * Create a new task with auto-generated ID
 */
export function createTask(
  tasksDir: string,
  subject: string,
  description: string,
  opts?: {
    owner?: string;
    blocks?: string[];
    blockedBy?: string[];
  }
): Task {
  const id = getNextTaskId(tasksDir);
  const task: Task = {
    id,
    subject,
    description,
    status: 'open',
    owner: opts?.owner,
    references: [],
    blocks: opts?.blocks || [],
    blockedBy: opts?.blockedBy || [],
    comments: [],
  };
  saveTask(tasksDir, task);
  return task;
}

/**
 * List all teams in a variant's tasks directory
 */
export function listTeams(rootDir: string, variant: string): string[] {
  const tasksRoot = path.join(rootDir, variant, 'config', 'tasks');
  if (!fs.existsSync(tasksRoot)) return [];
  return fs
    .readdirSync(tasksRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
}
