/**
 * Task Output Tests
 *
 * Tests for task JSON output formatters with enriched computed fields.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { formatTasksJson, formatTaskJson, formatMultiLocationJson } from '../../src/cli/commands/tasks/output.js';
import type { Task, TaskLocation, TaskSummary } from '../../src/core/tasks/types.js';

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

const makeLocation = (overrides: Partial<TaskLocation> = {}): TaskLocation => ({
  variant: 'test-variant',
  team: 'test-team',
  tasksDir: '/tmp/tasks',
  ...overrides,
});

const makeSummary = (overrides: Partial<TaskSummary> = {}): TaskSummary => ({
  total: 5,
  open: 3,
  resolved: 2,
  ready: 2,
  blocked: 1,
  ...overrides,
});

test('Task JSON Output', async (t) => {
  await t.test('formatTasksJson', async (st) => {
    await st.test('includes enriched computed fields', () => {
      const tasks: Task[] = [
        makeTask({ id: '1', status: 'open', blockedBy: ['2', '3'] }),
        makeTask({ id: '2', status: 'resolved' }),
        makeTask({ id: '3', status: 'open' }),
      ];

      const json = formatTasksJson(tasks, makeLocation(), makeSummary(), tasks);
      const parsed = JSON.parse(json);

      // Task 1 is blocked by task 3 (open)
      const task1 = parsed.tasks.find((t: { id: string }) => t.id === '1');
      assert.equal(task1.blocked, true, 'task 1 should be blocked');
      assert.deepEqual(task1.blockedBy, [
        { id: '2', status: 'resolved' },
        { id: '3', status: 'open' },
      ]);
      assert.deepEqual(task1.openBlockers, ['3']);
    });

    await st.test('handles task with no blockers', () => {
      const tasks: Task[] = [makeTask({ id: '1', status: 'open', blockedBy: [] })];

      const json = formatTasksJson(tasks, makeLocation(), makeSummary(), tasks);
      const parsed = JSON.parse(json);

      const task1 = parsed.tasks[0];
      assert.equal(task1.blocked, false);
      assert.deepEqual(task1.blockedBy, []);
      assert.deepEqual(task1.openBlockers, []);
    });

    await st.test('handles unknown blocker references', () => {
      const tasks: Task[] = [makeTask({ id: '1', blockedBy: ['999'] })];

      const json = formatTasksJson(tasks, makeLocation(), makeSummary(), tasks);
      const parsed = JSON.parse(json);

      const task1 = parsed.tasks[0];
      assert.deepEqual(task1.blockedBy, [{ id: '999', status: 'unknown' }]);
      assert.deepEqual(task1.openBlockers, []);
    });

    await st.test('includes all task fields', () => {
      const tasks: Task[] = [
        makeTask({
          id: '1',
          subject: 'Test Subject',
          description: 'Test Description',
          status: 'open',
          owner: 'agent-1',
          blocks: ['2'],
          blockedBy: [],
          references: ['3'],
          comments: [{ author: 'test', content: 'test comment' }],
        }),
      ];

      const json = formatTasksJson(tasks, makeLocation(), makeSummary(), tasks);
      const parsed = JSON.parse(json);

      const task1 = parsed.tasks[0];
      assert.equal(task1.id, '1');
      assert.equal(task1.subject, 'Test Subject');
      assert.equal(task1.description, 'Test Description');
      assert.equal(task1.status, 'open');
      assert.equal(task1.owner, 'agent-1');
      assert.deepEqual(task1.blocks, ['2']);
      assert.deepEqual(task1.references, ['3']);
      assert.deepEqual(task1.comments, [{ author: 'test', content: 'test comment' }]);
    });

    await st.test('includes location and summary', () => {
      const location = makeLocation({ variant: 'my-variant', team: 'my-team' });
      const summary = makeSummary({ total: 10, open: 5, resolved: 5, ready: 3, blocked: 2 });

      const json = formatTasksJson([], location, summary, []);
      const parsed = JSON.parse(json);

      assert.equal(parsed.variant, 'my-variant');
      assert.equal(parsed.team, 'my-team');
      assert.equal(parsed.summary.total, 10);
      assert.equal(parsed.summary.ready, 3);
      assert.equal(parsed.summary.blocked, 2);
    });
  });

  await t.test('formatTaskJson', async (st) => {
    await st.test('returns enriched single task', () => {
      const task = makeTask({ id: '1', blockedBy: ['2'] });
      const allTasks: Task[] = [task, makeTask({ id: '2', status: 'open' })];

      const json = formatTaskJson(task, makeLocation(), allTasks);
      const parsed = JSON.parse(json);

      assert.equal(parsed.task.id, '1');
      assert.equal(parsed.task.blocked, true);
      assert.deepEqual(parsed.task.blockedBy, [{ id: '2', status: 'open' }]);
      assert.deepEqual(parsed.task.openBlockers, ['2']);
    });

    await st.test('includes location', () => {
      const task = makeTask({ id: '1' });
      const location = makeLocation({ variant: 'v1', team: 't1' });

      const json = formatTaskJson(task, location, [task]);
      const parsed = JSON.parse(json);

      assert.equal(parsed.variant, 'v1');
      assert.equal(parsed.team, 't1');
    });
  });

  await t.test('formatMultiLocationJson', async (st) => {
    await st.test('returns enriched tasks per location', () => {
      const location1 = makeLocation({ variant: 'v1', team: 't1' });
      const location2 = makeLocation({ variant: 'v2', team: 't2' });

      const tasks1: Task[] = [makeTask({ id: '1', blockedBy: ['2'] }), makeTask({ id: '2', status: 'open' })];
      const tasks2: Task[] = [makeTask({ id: '3', status: 'resolved' })];

      const json = formatMultiLocationJson([
        { location: location1, tasks: tasks1, allTasks: tasks1, summary: makeSummary() },
        { location: location2, tasks: tasks2, allTasks: tasks2, summary: makeSummary() },
      ]);
      const parsed = JSON.parse(json);

      assert.equal(parsed.locations.length, 2);
      assert.equal(parsed.locations[0].variant, 'v1');
      assert.equal(parsed.locations[0].tasks[0].blocked, true);
      assert.equal(parsed.locations[1].variant, 'v2');
      assert.equal(parsed.locations[1].tasks[0].blocked, false);
    });
  });
});
