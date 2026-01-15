/**
 * Task Graph JSON Tests
 *
 * Tests for task graph JSON output.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { makeTempDir, cleanup } from '../helpers/index.js';
import type { Task } from '../../src/core/tasks/types.js';

// We'll test the graph output by running the actual command
// and parsing the JSON output

// Helper to create a minimal task file
const writeTask = (tasksDir: string, task: Task): void => {
  fs.writeFileSync(path.join(tasksDir, `${task.id}.json`), JSON.stringify(task, null, 2));
};

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

test('Task Graph JSON Output', async (t) => {
  const createdDirs: string[] = [];

  t.after(() => {
    for (const dir of createdDirs) {
      cleanup(dir);
    }
  });

  await t.test('graph JSON includes nodes with computed fields', async () => {
    const tmpDir = makeTempDir();
    createdDirs.push(tmpDir);

    // Create variant structure
    const variantDir = path.join(tmpDir, 'test-variant');
    const tasksDir = path.join(variantDir, 'config', 'tasks', 'test-team');
    fs.mkdirSync(tasksDir, { recursive: true });

    // Create variant.json
    fs.writeFileSync(path.join(variantDir, 'variant.json'), JSON.stringify({ name: 'test-variant' }));

    // Create tasks with dependencies
    writeTask(tasksDir, makeTask({ id: '1', subject: 'Root task', blocks: ['2'] }));
    writeTask(tasksDir, makeTask({ id: '2', subject: 'Dependent task', blockedBy: ['1'], blocks: ['3'] }));
    writeTask(tasksDir, makeTask({ id: '3', subject: 'Leaf task', blockedBy: ['2'], status: 'open' }));

    // Import and run the graph function
    const { runTasksGraph } = await import('../../src/cli/commands/tasks/graph.js');

    // Capture console output
    let output = '';
    const originalLog = console.log;
    console.log = (msg: string) => {
      output = msg;
    };

    runTasksGraph({
      rootDir: tmpDir,
      variant: 'test-variant',
      team: 'test-team',
      json: true,
    });

    console.log = originalLog;

    const parsed = JSON.parse(output);

    // Verify structure
    assert.equal(parsed.variant, 'test-variant');
    assert.equal(parsed.team, 'test-team');
    assert.equal(parsed.nodes.length, 3);

    // Verify computed fields on nodes
    const node1 = parsed.nodes.find((n: { id: string }) => n.id === '1');
    assert.equal(node1.blocked, false);
    assert.deepEqual(node1.blockedBy, []);
    assert.deepEqual(node1.openBlockers, []);
    assert.deepEqual(node1.blocks, ['2']);
    assert.equal(node1.depth, 0);

    const node2 = parsed.nodes.find((n: { id: string }) => n.id === '2');
    assert.equal(node2.blocked, true);
    assert.deepEqual(node2.blockedBy, [{ id: '1', status: 'open' }]);
    assert.deepEqual(node2.openBlockers, ['1']);
    assert.equal(node2.depth, 1);

    const node3 = parsed.nodes.find((n: { id: string }) => n.id === '3');
    assert.equal(node3.blocked, true);
    assert.deepEqual(node3.blockedBy, [{ id: '2', status: 'open' }]);
    assert.deepEqual(node3.openBlockers, ['2']);
    assert.equal(node3.depth, 2);

    // Verify roots and leaves
    assert.deepEqual(parsed.roots, ['1']);
    assert.deepEqual(parsed.leaves, ['3']);
    assert.deepEqual(parsed.orphans, []);

    // Verify summary includes ready count
    assert.equal(parsed.summary.total, 3);
    assert.equal(parsed.summary.open, 3);
    assert.equal(parsed.summary.resolved, 0);
    assert.equal(parsed.summary.ready, 1); // Only task 1 is ready
    assert.equal(parsed.summary.blocked, 2);
  });

  await t.test('graph JSON handles resolved dependencies', async () => {
    const tmpDir = makeTempDir();
    createdDirs.push(tmpDir);

    const variantDir = path.join(tmpDir, 'test-variant');
    const tasksDir = path.join(variantDir, 'config', 'tasks', 'test-team');
    fs.mkdirSync(tasksDir, { recursive: true });
    fs.writeFileSync(path.join(variantDir, 'variant.json'), JSON.stringify({ name: 'test-variant' }));

    // Create tasks where blocker is resolved
    writeTask(tasksDir, makeTask({ id: '1', subject: 'Resolved blocker', status: 'resolved', blocks: ['2'] }));
    writeTask(tasksDir, makeTask({ id: '2', subject: 'Unblocked task', blockedBy: ['1'], status: 'open' }));

    const { runTasksGraph } = await import('../../src/cli/commands/tasks/graph.js');

    let output = '';
    const originalLog = console.log;
    console.log = (msg: string) => {
      output = msg;
    };

    runTasksGraph({
      rootDir: tmpDir,
      variant: 'test-variant',
      team: 'test-team',
      json: true,
    });

    console.log = originalLog;

    const parsed = JSON.parse(output);

    const node2 = parsed.nodes.find((n: { id: string }) => n.id === '2');
    assert.equal(node2.blocked, false, 'should not be blocked when blocker is resolved');
    assert.deepEqual(node2.blockedBy, [{ id: '1', status: 'resolved' }]);
    assert.deepEqual(node2.openBlockers, []);
  });

  await t.test('graph JSON identifies orphans', async () => {
    const tmpDir = makeTempDir();
    createdDirs.push(tmpDir);

    const variantDir = path.join(tmpDir, 'test-variant');
    const tasksDir = path.join(variantDir, 'config', 'tasks', 'test-team');
    fs.mkdirSync(tasksDir, { recursive: true });
    fs.writeFileSync(path.join(variantDir, 'variant.json'), JSON.stringify({ name: 'test-variant' }));

    // Create orphan task (blockedBy non-existent task)
    writeTask(tasksDir, makeTask({ id: '1', subject: 'Orphan task', blockedBy: ['999'] }));

    const { runTasksGraph } = await import('../../src/cli/commands/tasks/graph.js');

    let output = '';
    const originalLog = console.log;
    console.log = (msg: string) => {
      output = msg;
    };

    runTasksGraph({
      rootDir: tmpDir,
      variant: 'test-variant',
      team: 'test-team',
      json: true,
    });

    console.log = originalLog;

    const parsed = JSON.parse(output);

    assert.deepEqual(parsed.orphans, ['1']);
    assert.deepEqual(parsed.roots, []); // Orphan has blockedBy, so not a root

    const node1 = parsed.nodes.find((n: { id: string }) => n.id === '1');
    assert.deepEqual(node1.blockedBy, [{ id: '999', status: 'unknown' }]);
  });

  await t.test('graph JSON handles empty task list', async () => {
    const tmpDir = makeTempDir();
    createdDirs.push(tmpDir);

    const variantDir = path.join(tmpDir, 'test-variant');
    const tasksDir = path.join(variantDir, 'config', 'tasks', 'test-team');
    fs.mkdirSync(tasksDir, { recursive: true });
    fs.writeFileSync(path.join(variantDir, 'variant.json'), JSON.stringify({ name: 'test-variant' }));

    const { runTasksGraph } = await import('../../src/cli/commands/tasks/graph.js');

    let output = '';
    const originalLog = console.log;
    console.log = (msg: string) => {
      output = msg;
    };

    runTasksGraph({
      rootDir: tmpDir,
      variant: 'test-variant',
      team: 'test-team',
      json: true,
    });

    console.log = originalLog;

    const parsed = JSON.parse(output);

    assert.equal(parsed.variant, 'test-variant');
    assert.equal(parsed.team, 'test-team');
    assert.deepEqual(parsed.nodes, []);
    assert.equal(parsed.summary.total, 0);
    assert.equal(parsed.summary.ready, 0);
  });
});
