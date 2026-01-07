/**
 * App Integration Tests - Quick Setup Flow
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { render } from 'ink-testing-library';
import { App } from '../../src/tui/app.js';
import * as providers from '../../src/providers/index.js';
import { tick, send, waitFor, KEYS, makeCore } from '../helpers/index.js';

delete process.env.Z_AI_API_KEY;
delete process.env.ANTHROPIC_API_KEY;

test('Quick setup flow completes successfully', async () => {
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

  // Quick Setup
  await send(app.stdin, KEYS.enter);
  await tick();

  // Select provider - navigate down from mirror to zai
  await send(app.stdin, KEYS.down);
  await send(app.stdin, KEYS.enter);
  await tick();

  // Continue from intro screen
  await send(app.stdin, KEYS.enter);
  await tick();

  // Enter API key (just press enter for empty)
  await send(app.stdin, KEYS.enter);
  await tick();

  // Enter variant name (just press enter for default)
  await send(app.stdin, KEYS.enter);

  // Wait for creation
  const created = await waitFor(() => calls.create.length > 0);

  assert.ok(created, 'Variant should be created');
  assert.equal(calls.create[0].providerKey, 'zai', 'Provider should be zai');

  app.unmount();
});
