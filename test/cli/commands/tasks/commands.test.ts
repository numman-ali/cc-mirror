import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import { runTasksShow } from '../../../../src/cli/commands/tasks/show.js';
import { runTasksUpdate } from '../../../../src/cli/commands/tasks/update.js';
import { runTasksClean } from '../../../../src/cli/commands/tasks/clean.js';
import { saveTask, loadTask } from '../../../../src/core/tasks/index.js';
import { makeTempDir, cleanup } from '../../../helpers/index.js';

const captureConsole = () => {
  const logs: string[] = [];
  const errors: string[] = [];
  const originalLog = console.log;
  const originalError = console.error;

  console.log = (...args: unknown[]) => {
    logs.push(args.join(' '));
  };
  console.error = (...args: unknown[]) => {
    errors.push(args.join(' '));
  };

  return {
    logs,
    errors,
    restore: () => {
      console.log = originalLog;
      console.error = originalError;
    },
  };
};

const findJsonLog = (logs: string[]) => {
  for (const line of logs) {
    try {
      return JSON.parse(line) as unknown;
    } catch {
      continue;
    }
  }
  return null;
};

const createTasksDir = (rootDir: string, variant = 'alpha', team = 'team') => {
  const tasksDir = path.join(rootDir, variant, 'config', 'tasks', team);
  fs.mkdirSync(tasksDir, { recursive: true });
  return tasksDir;
};

const createTask = (tasksDir: string, overrides: Partial<Parameters<typeof saveTask>[1]> = {}) => {
  const task = {
    id: '1',
    subject: 'Test task',
    description: 'Test description',
    status: 'open' as const,
    owner: undefined as string | undefined,
    references: [],
    blocks: [],
    blockedBy: [],
    comments: [],
    ...overrides,
  };
  saveTask(tasksDir, task);
  return task;
};

test('runTasksShow prints task detail as json', () => {
  const rootDir = makeTempDir();
  const consoleCapture = captureConsole();
  const previousExitCode = process.exitCode;
  process.exitCode = undefined;

  try {
    const tasksDir = createTasksDir(rootDir);
    createTask(tasksDir);

    runTasksShow({ rootDir, variant: 'alpha', team: 'team', taskId: '1', json: true });

    assert.equal(consoleCapture.errors.length, 0);
    const payload = findJsonLog(consoleCapture.logs) as { task?: { id?: string } } | null;
    assert.equal(payload?.task?.id, '1');
    assert.equal(process.exitCode, undefined);
  } finally {
    process.exitCode = previousExitCode;
    consoleCapture.restore();
    cleanup(rootDir);
  }
});

test('runTasksShow sets exitCode when no task locations found', () => {
  const rootDir = makeTempDir();
  const consoleCapture = captureConsole();
  const previousExitCode = process.exitCode;
  process.exitCode = undefined;

  try {
    runTasksShow({ rootDir, variant: 'missing', team: 'team', taskId: '99', json: false });

    assert.ok(consoleCapture.errors[0]?.includes('No task locations found'));
    assert.equal(process.exitCode, 1);
  } finally {
    process.exitCode = previousExitCode;
    consoleCapture.restore();
    cleanup(rootDir);
  }
});

test('runTasksUpdate updates task fields and writes json output', () => {
  const rootDir = makeTempDir();
  const consoleCapture = captureConsole();
  const previousExitCode = process.exitCode;
  process.exitCode = undefined;

  try {
    const tasksDir = createTasksDir(rootDir);
    createTask(tasksDir, {
      id: '2',
      subject: 'Old subject',
      description: 'Old description',
      status: 'open',
      owner: 'alice',
      blocks: ['3'],
      blockedBy: ['4'],
    });

    runTasksUpdate({
      rootDir,
      variant: 'alpha',
      team: 'team',
      taskId: '2',
      subject: 'New subject',
      description: 'New description',
      status: 'resolved',
      owner: '',
      addBlocks: ['5'],
      removeBlocks: ['3'],
      addBlockedBy: ['6'],
      removeBlockedBy: ['4'],
      addComment: 'Looks good',
      commentAuthor: 'tester',
      json: true,
    });

    const updated = loadTask(tasksDir, '2');
    assert.ok(updated);
    assert.equal(updated?.subject, 'New subject');
    assert.equal(updated?.description, 'New description');
    assert.equal(updated?.status, 'resolved');
    assert.equal(updated?.owner, undefined);
    assert.deepEqual(updated?.blocks, ['5']);
    assert.deepEqual(updated?.blockedBy, ['6']);
    assert.equal(updated?.comments.length, 1);
    assert.equal(updated?.comments[0].author, 'tester');
    const payload = findJsonLog(consoleCapture.logs) as { task?: { id?: string } } | null;
    assert.equal(payload?.task?.id, '2');
    assert.equal(process.exitCode, undefined);
  } finally {
    process.exitCode = previousExitCode;
    consoleCapture.restore();
    cleanup(rootDir);
  }
});

test('runTasksUpdate sets exitCode when task is missing', () => {
  const rootDir = makeTempDir();
  const consoleCapture = captureConsole();
  const previousExitCode = process.exitCode;
  process.exitCode = undefined;

  try {
    createTasksDir(rootDir);
    runTasksUpdate({ rootDir, variant: 'alpha', team: 'team', taskId: '404', json: false });

    assert.ok(consoleCapture.errors[0]?.includes('Task #404 not found.'));
    assert.equal(process.exitCode, 1);
  } finally {
    process.exitCode = previousExitCode;
    consoleCapture.restore();
    cleanup(rootDir);
  }
});

test('runTasksClean validates filters and deletes tasks when forced', async () => {
  const rootDir = makeTempDir();
  const consoleCapture = captureConsole();
  const previousExitCode = process.exitCode;
  process.exitCode = undefined;

  try {
    const tasksDir = createTasksDir(rootDir);
    createTask(tasksDir, { id: '10', status: 'resolved' });
    createTask(tasksDir, { id: '11', status: 'resolved' });

    await runTasksClean({ rootDir, variant: 'alpha', team: 'team' });
    assert.ok(consoleCapture.errors[0]?.includes('Specify at least one filter'));
    assert.equal(process.exitCode, 1);

    process.exitCode = undefined;
    consoleCapture.errors.length = 0;
    consoleCapture.logs.length = 0;

    await runTasksClean({ rootDir, variant: 'alpha', team: 'team', resolved: true, dryRun: true });
    assert.ok(consoleCapture.logs.some((line) => line.includes('Dry run')));
    assert.ok(fs.existsSync(path.join(tasksDir, '10.json')));

    consoleCapture.logs.length = 0;

    await runTasksClean({ rootDir, variant: 'alpha', team: 'team', resolved: true, force: true, json: true });
    assert.equal(fs.existsSync(path.join(tasksDir, '10.json')), false);
    assert.equal(fs.existsSync(path.join(tasksDir, '11.json')), false);
    const payload = findJsonLog(consoleCapture.logs) as { deleted?: number } | null;
    assert.equal(payload?.deleted, 2);
  } finally {
    process.exitCode = previousExitCode;
    consoleCapture.restore();
    cleanup(rootDir);
  }
});

test('runTasksClean supports older-than filtering', async () => {
  const rootDir = makeTempDir();
  const consoleCapture = captureConsole();
  const previousExitCode = process.exitCode;
  process.exitCode = undefined;

  try {
    const tasksDir = createTasksDir(rootDir);
    createTask(tasksDir, { id: '20', status: 'resolved' });
    createTask(tasksDir, { id: '21', status: 'resolved' });

    const oldPath = path.join(tasksDir, '20.json');
    const oldDate = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    fs.utimesSync(oldPath, oldDate, oldDate);

    await runTasksClean({ rootDir, variant: 'alpha', team: 'team', resolved: true, olderThan: 2, force: true });
    assert.equal(fs.existsSync(oldPath), false);
    assert.equal(fs.existsSync(path.join(tasksDir, '21.json')), true);
  } finally {
    process.exitCode = previousExitCode;
    consoleCapture.restore();
    cleanup(rootDir);
  }
});
