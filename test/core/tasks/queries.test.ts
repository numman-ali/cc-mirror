/**
 * Task Queries Tests
 *
 * Tests for task filtering and query logic.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isBlocked,
  isBlocking,
  filterTasks,
  getTaskSummary,
  sortTasksById,
  sortByDependency,
} from '../../../src/core/tasks/queries.js';
import type { Task } from '../../../src/core/tasks/types.js';

// Helper to create a minimal task
const makeTask = (overrides: Partial<Task>): Task => ({
  id: '1',
  subject: 'Test',
  description: '',
  status: 'open',
  references: [],
  blocks: [],
  blockedBy: [],
  comments: [],
  ...overrides,
});

test('Task Queries', async (t) => {
  await t.test('isBlocked', async (st) => {
    await st.test('returns false for task with no blockedBy', () => {
      const task = makeTask({ id: '1', blockedBy: [] });
      assert.equal(isBlocked(task, [task]), false);
    });

    await st.test('returns false when all blocking tasks are resolved', () => {
      const task1 = makeTask({ id: '1', blockedBy: ['2', '3'] });
      const task2 = makeTask({ id: '2', status: 'resolved' });
      const task3 = makeTask({ id: '3', status: 'resolved' });

      assert.equal(isBlocked(task1, [task1, task2, task3]), false);
    });

    await st.test('returns true when any blocking task is open', () => {
      const task1 = makeTask({ id: '1', blockedBy: ['2', '3'] });
      const task2 = makeTask({ id: '2', status: 'resolved' });
      const task3 = makeTask({ id: '3', status: 'open' });

      assert.equal(isBlocked(task1, [task1, task2, task3]), true);
    });

    await st.test('returns false when blocking task does not exist', () => {
      const task1 = makeTask({ id: '1', blockedBy: ['999'] });

      // If the blocking task doesn't exist, consider it not blocked
      assert.equal(isBlocked(task1, [task1]), false);
    });
  });

  await t.test('isBlocking', async (st) => {
    await st.test('returns true when task has blocks', () => {
      const task = makeTask({ blocks: ['2', '3'] });
      assert.equal(isBlocking(task), true);
    });

    await st.test('returns false when task has no blocks', () => {
      const task = makeTask({ blocks: [] });
      assert.equal(isBlocking(task), false);
    });
  });

  await t.test('filterTasks', async (st) => {
    const tasks: Task[] = [
      makeTask({ id: '1', status: 'open', owner: 'agent-1' }),
      makeTask({ id: '2', status: 'resolved', owner: 'agent-1' }),
      makeTask({ id: '3', status: 'open', owner: 'agent-2', blockedBy: ['4'] }),
      makeTask({ id: '4', status: 'open', blocks: ['3'] }),
      makeTask({ id: '5', status: 'resolved', owner: 'agent-2' }),
    ];

    await st.test('filters by status open', () => {
      const result = filterTasks(tasks, { status: 'open' });
      assert.equal(result.length, 3);
      assert.ok(result.every((t) => t.status === 'open'));
    });

    await st.test('filters by status resolved', () => {
      const result = filterTasks(tasks, { status: 'resolved' });
      assert.equal(result.length, 2);
      assert.ok(result.every((t) => t.status === 'resolved'));
    });

    await st.test('filters by status all returns everything', () => {
      const result = filterTasks(tasks, { status: 'all' });
      assert.equal(result.length, 5);
    });

    await st.test('filters by blocked true', () => {
      const result = filterTasks(tasks, { blocked: true }, tasks);
      assert.equal(result.length, 1);
      assert.equal(result[0].id, '3');
    });

    await st.test('filters by blocked false', () => {
      const result = filterTasks(tasks, { blocked: false }, tasks);
      assert.equal(result.length, 4);
      assert.ok(!result.some((t) => t.id === '3'));
    });

    await st.test('filters by blocking true', () => {
      const result = filterTasks(tasks, { blocking: true });
      assert.equal(result.length, 1);
      assert.equal(result[0].id, '4');
    });

    await st.test('filters by owner', () => {
      const result = filterTasks(tasks, { owner: 'agent-2' });
      assert.equal(result.length, 2);
      assert.ok(result.every((t) => t.owner === 'agent-2'));
    });

    await st.test('applies limit', () => {
      const result = filterTasks(tasks, { limit: 2 });
      assert.equal(result.length, 2);
    });

    await st.test('combines multiple filters', () => {
      const result = filterTasks(tasks, { status: 'open', owner: 'agent-1' });
      assert.equal(result.length, 1);
      assert.equal(result[0].id, '1');
    });
  });

  await t.test('getTaskSummary', async (st) => {
    await st.test('returns correct counts', () => {
      const tasks: Task[] = [
        makeTask({ id: '1', status: 'open' }),
        makeTask({ id: '2', status: 'open', blockedBy: ['4'] }),
        makeTask({ id: '3', status: 'resolved' }),
        makeTask({ id: '4', status: 'open' }),
        makeTask({ id: '5', status: 'resolved' }),
      ];

      const summary = getTaskSummary(tasks);

      assert.equal(summary.total, 5);
      assert.equal(summary.open, 3);
      assert.equal(summary.resolved, 2);
      assert.equal(summary.blocked, 1);
    });

    await st.test('handles empty task list', () => {
      const summary = getTaskSummary([]);

      assert.equal(summary.total, 0);
      assert.equal(summary.open, 0);
      assert.equal(summary.resolved, 0);
      assert.equal(summary.blocked, 0);
    });
  });

  await t.test('sortTasksById', async (st) => {
    await st.test('sorts by numeric ID', () => {
      const tasks = [makeTask({ id: '10' }), makeTask({ id: '2' }), makeTask({ id: '1' }), makeTask({ id: '5' })];

      const result = sortTasksById(tasks);

      assert.deepEqual(
        result.map((t) => t.id),
        ['1', '2', '5', '10']
      );
    });

    await st.test('does not mutate original array', () => {
      const tasks = [makeTask({ id: '2' }), makeTask({ id: '1' })];
      const original = [...tasks];

      sortTasksById(tasks);

      assert.equal(tasks[0].id, original[0].id);
    });
  });

  await t.test('sortByDependency', async (st) => {
    await st.test('puts tasks with no blockedBy first', () => {
      const tasks = [
        makeTask({ id: '1', blockedBy: ['2'] }),
        makeTask({ id: '2', blockedBy: [] }),
        makeTask({ id: '3', blockedBy: ['1'] }),
      ];

      const result = sortByDependency(tasks);

      // Task 2 has no blockedBy, should be first
      assert.equal(result[0].id, '2');
      // Task 1 blocked by 2, should be next
      assert.equal(result[1].id, '1');
      // Task 3 blocked by 1, should be last
      assert.equal(result[2].id, '3');
    });

    await st.test('handles multiple independent tasks', () => {
      const tasks = [
        makeTask({ id: '1', blockedBy: [] }),
        makeTask({ id: '2', blockedBy: [] }),
        makeTask({ id: '3', blockedBy: ['1', '2'] }),
      ];

      const result = sortByDependency(tasks);

      // Tasks 1 and 2 should come before 3
      const task3Index = result.findIndex((t) => t.id === '3');
      const task1Index = result.findIndex((t) => t.id === '1');
      const task2Index = result.findIndex((t) => t.id === '2');

      assert.ok(task1Index < task3Index);
      assert.ok(task2Index < task3Index);
    });

    await st.test('handles circular dependencies gracefully', () => {
      const tasks = [makeTask({ id: '1', blockedBy: ['2'] }), makeTask({ id: '2', blockedBy: ['1'] })];

      // Should not hang or throw, returns tasks in some order
      const result = sortByDependency(tasks);
      assert.equal(result.length, 2);
    });

    await st.test('handles complex dependency chain', () => {
      const tasks = [
        makeTask({ id: '5', blockedBy: ['4'] }),
        makeTask({ id: '4', blockedBy: ['3'] }),
        makeTask({ id: '3', blockedBy: ['2'] }),
        makeTask({ id: '2', blockedBy: ['1'] }),
        makeTask({ id: '1', blockedBy: [] }),
      ];

      const result = sortByDependency(tasks);

      // Should be in order 1, 2, 3, 4, 5
      assert.deepEqual(
        result.map((t) => t.id),
        ['1', '2', '3', '4', '5']
      );
    });
  });
});
