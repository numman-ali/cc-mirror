/**
 * Task Store Tests
 *
 * Tests for task CRUD operations.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { makeTempDir, cleanup } from '../../helpers/index.js';
import {
  getTasksDir,
  listTaskIds,
  loadTask,
  loadAllTasks,
  saveTask,
  deleteTask,
  getNextTaskId,
  createTask,
  listTeams,
} from '../../../src/core/tasks/store.js';
import type { Task } from '../../../src/core/tasks/types.js';

test('Task Store', async (t) => {
  const createdDirs: string[] = [];

  t.after(() => {
    for (const dir of createdDirs) {
      cleanup(dir);
    }
  });

  await t.test('getTasksDir returns correct path', () => {
    const rootDir = path.join(path.sep, 'home', 'user', '.claude-sneakpeek');
    const result = getTasksDir(rootDir, 'myvariant', 'myteam');
    assert.equal(result, path.join(rootDir, 'myvariant', 'config', 'tasks', 'myteam'));
  });

  await t.test('listTaskIds returns empty array for non-existent directory', () => {
    const tmpDir = makeTempDir();
    createdDirs.push(tmpDir);

    const result = listTaskIds(path.join(tmpDir, 'nonexistent'));
    assert.deepEqual(result, []);
  });

  await t.test('listTaskIds returns sorted task IDs', () => {
    const tmpDir = makeTempDir();
    createdDirs.push(tmpDir);

    // Create task files with various IDs
    fs.mkdirSync(tmpDir, { recursive: true });
    fs.writeFileSync(path.join(tmpDir, '5.json'), '{}');
    fs.writeFileSync(path.join(tmpDir, '1.json'), '{}');
    fs.writeFileSync(path.join(tmpDir, '10.json'), '{}');
    fs.writeFileSync(path.join(tmpDir, '2.json'), '{}');

    const result = listTaskIds(tmpDir);
    assert.deepEqual(result, ['1', '2', '5', '10']);
  });

  await t.test('listTaskIds ignores non-json files', () => {
    const tmpDir = makeTempDir();
    createdDirs.push(tmpDir);

    fs.writeFileSync(path.join(tmpDir, '1.json'), '{}');
    fs.writeFileSync(path.join(tmpDir, '2.txt'), 'text');
    fs.writeFileSync(path.join(tmpDir, 'readme.md'), 'readme');

    const result = listTaskIds(tmpDir);
    assert.deepEqual(result, ['1']);
  });

  await t.test('loadTask returns null for non-existent task', () => {
    const tmpDir = makeTempDir();
    createdDirs.push(tmpDir);

    const result = loadTask(tmpDir, '999');
    assert.equal(result, null);
  });

  await t.test('loadTask returns task data', () => {
    const tmpDir = makeTempDir();
    createdDirs.push(tmpDir);

    const task: Task = {
      id: '1',
      subject: 'Test task',
      description: 'Test description',
      status: 'open',
      references: [],
      blocks: [],
      blockedBy: [],
      comments: [],
    };

    fs.writeFileSync(path.join(tmpDir, '1.json'), JSON.stringify(task));

    const result = loadTask(tmpDir, '1');
    assert.deepEqual(result, task);
  });

  await t.test('loadAllTasks returns all tasks in order', () => {
    const tmpDir = makeTempDir();
    createdDirs.push(tmpDir);

    const task1: Task = {
      id: '1',
      subject: 'First',
      description: '',
      status: 'open',
      references: [],
      blocks: [],
      blockedBy: [],
      comments: [],
    };
    const task2: Task = {
      id: '2',
      subject: 'Second',
      description: '',
      status: 'resolved',
      references: [],
      blocks: [],
      blockedBy: [],
      comments: [],
    };

    fs.writeFileSync(path.join(tmpDir, '1.json'), JSON.stringify(task1));
    fs.writeFileSync(path.join(tmpDir, '2.json'), JSON.stringify(task2));

    const result = loadAllTasks(tmpDir);
    assert.equal(result.length, 2);
    assert.equal(result[0].id, '1');
    assert.equal(result[1].id, '2');
  });

  await t.test('saveTask creates directory and writes task', () => {
    const tmpDir = makeTempDir();
    createdDirs.push(tmpDir);

    const tasksDir = path.join(tmpDir, 'nested', 'tasks');
    const task: Task = {
      id: '42',
      subject: 'New task',
      description: 'Description',
      status: 'open',
      references: [],
      blocks: ['43'],
      blockedBy: ['41'],
      comments: [{ author: 'agent-1', content: 'Hello' }],
    };

    saveTask(tasksDir, task);

    assert.ok(fs.existsSync(path.join(tasksDir, '42.json')));
    const saved = JSON.parse(fs.readFileSync(path.join(tasksDir, '42.json'), 'utf8'));
    assert.deepEqual(saved, task);
  });

  await t.test('deleteTask removes existing task', () => {
    const tmpDir = makeTempDir();
    createdDirs.push(tmpDir);

    fs.writeFileSync(path.join(tmpDir, '1.json'), '{}');
    assert.ok(fs.existsSync(path.join(tmpDir, '1.json')));

    const result = deleteTask(tmpDir, '1');
    assert.equal(result, true);
    assert.ok(!fs.existsSync(path.join(tmpDir, '1.json')));
  });

  await t.test('deleteTask returns false for non-existent task', () => {
    const tmpDir = makeTempDir();
    createdDirs.push(tmpDir);

    const result = deleteTask(tmpDir, '999');
    assert.equal(result, false);
  });

  await t.test('getNextTaskId returns 1 for empty directory', () => {
    const tmpDir = makeTempDir();
    createdDirs.push(tmpDir);

    const result = getNextTaskId(tmpDir);
    assert.equal(result, '1');
  });

  await t.test('getNextTaskId returns next ID after max', () => {
    const tmpDir = makeTempDir();
    createdDirs.push(tmpDir);

    fs.writeFileSync(path.join(tmpDir, '1.json'), '{}');
    fs.writeFileSync(path.join(tmpDir, '5.json'), '{}');
    fs.writeFileSync(path.join(tmpDir, '3.json'), '{}');

    const result = getNextTaskId(tmpDir);
    assert.equal(result, '6');
  });

  await t.test('createTask creates task with auto ID', () => {
    const tmpDir = makeTempDir();
    createdDirs.push(tmpDir);

    const task = createTask(tmpDir, 'My subject', 'My description');

    assert.equal(task.id, '1');
    assert.equal(task.subject, 'My subject');
    assert.equal(task.description, 'My description');
    assert.equal(task.status, 'open');
    assert.deepEqual(task.references, []);
    assert.deepEqual(task.blocks, []);
    assert.deepEqual(task.blockedBy, []);
    assert.deepEqual(task.comments, []);

    // Verify saved to disk
    assert.ok(fs.existsSync(path.join(tmpDir, '1.json')));
  });

  await t.test('createTask accepts optional owner and dependencies', () => {
    const tmpDir = makeTempDir();
    createdDirs.push(tmpDir);

    const task = createTask(tmpDir, 'Subject', 'Desc', {
      owner: 'agent-123',
      blocks: ['2', '3'],
      blockedBy: ['0'],
    });

    assert.equal(task.owner, 'agent-123');
    assert.deepEqual(task.blocks, ['2', '3']);
    assert.deepEqual(task.blockedBy, ['0']);
  });

  await t.test('createTask increments ID correctly', () => {
    const tmpDir = makeTempDir();
    createdDirs.push(tmpDir);

    const task1 = createTask(tmpDir, 'First', 'Desc');
    const task2 = createTask(tmpDir, 'Second', 'Desc');
    const task3 = createTask(tmpDir, 'Third', 'Desc');

    assert.equal(task1.id, '1');
    assert.equal(task2.id, '2');
    assert.equal(task3.id, '3');
  });

  await t.test('listTeams returns empty for non-existent variant', () => {
    const tmpDir = makeTempDir();
    createdDirs.push(tmpDir);

    const result = listTeams(tmpDir, 'nonexistent');
    assert.deepEqual(result, []);
  });

  await t.test('listTeams returns team directories', () => {
    const tmpDir = makeTempDir();
    createdDirs.push(tmpDir);

    // Create variant with teams
    const tasksRoot = path.join(tmpDir, 'myvariant', 'config', 'tasks');
    fs.mkdirSync(path.join(tasksRoot, 'team-alpha'), { recursive: true });
    fs.mkdirSync(path.join(tasksRoot, 'team-beta'), { recursive: true });
    // Create a file (should be ignored)
    fs.writeFileSync(path.join(tasksRoot, 'readme.txt'), 'ignored');

    const result = listTeams(tmpDir, 'myvariant');
    assert.ok(result.includes('team-alpha'));
    assert.ok(result.includes('team-beta'));
    assert.equal(result.length, 2);
  });
});
