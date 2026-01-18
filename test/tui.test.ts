import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { render } from 'ink-testing-library';
import { App } from '../src/tui/app.js';
import * as providers from '../src/providers/index.js';

delete process.env.Z_AI_API_KEY;
delete process.env.ANTHROPIC_API_KEY;

// Import test helpers
import { tick, send, waitFor, KEYS, makeCore } from './helpers/index.js';

const down = KEYS.down;
const enter = KEYS.enter;

test('TUI create flow applies tweakcc by default', async () => {
  const { core, calls } = makeCore();
  const app = render(
    React.createElement(App, {
      core,
      providers,
      initialRootDir: '/tmp/root',
      initialBinDir: '/tmp/bin',
    })
  );

  await tick();
  await send(app.stdin, down); // home -> create
  await send(app.stdin, enter);
  await send(app.stdin, down); // provider select -> navigate from mirror to zai
  await send(app.stdin, enter); // select zai
  await send(app.stdin, enter); // intro screen -> continue
  await send(app.stdin, enter); // brand preset (auto)
  await send(app.stdin, enter); // name
  await send(app.stdin, enter); // base url
  await send(app.stdin, enter); // api key
  await send(app.stdin, enter); // prompt pack mode (maximal) - skipped yes/no for zai/minimax
  await send(app.stdin, enter); // install dev-browser? default Yes
  await send(app.stdin, enter); // write Z_AI_API_KEY? default Yes
  await send(app.stdin, down); // add env? select No
  await send(app.stdin, enter);

  const reachedSummary = await waitFor(() => {
    const frame = app.lastFrame() || '';
    return frame.includes('Review Configuration') || frame.includes('Extra environment variables');
  });
  assert.ok(reachedSummary);

  const frame = app.lastFrame() || '';
  if (frame.includes('Extra environment variables')) {
    await send(app.stdin, enter); // submit empty env line
    await waitFor(() => (app.lastFrame() || '').includes('Review Configuration'));
  }

  await send(app.stdin, enter); // summary -> create

  const created = await waitFor(() => calls.create.length > 0);
  assert.ok(created);
  assert.equal(calls.create.length, 1);
  assert.equal(calls.create[0].name, 'zai');
  assert.equal(calls.create[0].providerKey, 'zai');
  assert.equal(calls.create[0].noTweak, false); // tweakcc always applied now

  app.unmount();
});

test('TUI manage -> update flow', async () => {
  const { core, calls } = makeCore();
  const app = render(
    React.createElement(App, {
      core,
      providers,
      initialRootDir: '/tmp/root',
      initialBinDir: '/tmp/bin',
    })
  );

  await tick();
  await send(app.stdin, down); // create
  await send(app.stdin, down); // manage
  await send(app.stdin, enter);
  await send(app.stdin, enter); // pick alpha
  await tick();
  await send(app.stdin, enter); // update
  await waitFor(() => calls.update.length > 0);

  assert.equal(calls.update.length, 1);
  assert.equal(calls.update[0].name, 'alpha');

  app.unmount();
});

test('TUI manage -> remove flow', async () => {
  const { core, calls } = makeCore();
  const app = render(
    React.createElement(App, {
      core,
      providers,
      initialRootDir: '/tmp/root',
      initialBinDir: '/tmp/bin',
    })
  );

  await tick();
  await send(app.stdin, down); // create
  await send(app.stdin, down); // manage
  await send(app.stdin, enter);
  await send(app.stdin, enter); // pick alpha
  await tick();
  await send(app.stdin, down); // tweak
  await send(app.stdin, down); // remove
  await send(app.stdin, enter);
  await send(app.stdin, enter); // confirm remove
  await waitFor(() => calls.remove.length > 0);

  assert.equal(calls.remove.length, 1);
  assert.equal(calls.remove[0].name, 'alpha');

  app.unmount();
});

test('TUI update all flow', async () => {
  const { core, calls } = makeCore();
  const app = render(
    React.createElement(App, {
      core,
      providers,
      initialRootDir: '/tmp/root',
      initialBinDir: '/tmp/bin',
    })
  );

  await tick();
  await send(app.stdin, down); // create
  await send(app.stdin, down); // manage
  await send(app.stdin, down); // updateAll
  await send(app.stdin, enter);
  const updated = await waitFor(() => calls.update.length === 2);
  assert.ok(updated, 'Update all should trigger updates for all variants');
  assert.equal(calls.update[0].name, 'alpha');
  assert.equal(calls.update[1].name, 'beta');

  app.unmount();
});

test('TUI doctor flow', async () => {
  const { core, calls } = makeCore();
  const app = render(
    React.createElement(App, {
      core,
      providers,
      initialRootDir: '/tmp/root',
      initialBinDir: '/tmp/bin',
    })
  );

  await tick();
  await send(app.stdin, down); // create
  await send(app.stdin, down); // manage
  await send(app.stdin, down); // updateAll
  await send(app.stdin, down); // doctor
  await send(app.stdin, enter);
  await tick();

  const frame = app.lastFrame() || '';
  assert.ok(frame.includes('alpha'));
  assert.ok(calls.doctor.length >= 1);
  assert.equal(calls.doctor[0].root, '/tmp/root');
  assert.equal(calls.doctor[0].bin, '/tmp/bin');

  app.unmount();
});

// Settings flow test removed - Settings option was removed from TUI
