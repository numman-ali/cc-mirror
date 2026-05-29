/**
 * App ESC Key Navigation Tests
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { render } from 'ink-testing-library';
import { App } from '../../src/tui/app.js';
import * as providers from '../../src/providers/index.js';
import { tick, send, KEYS, makeCore } from '../helpers/index.js';

delete process.env.Z_AI_API_KEY;
delete process.env.ANTHROPIC_AUTH_TOKEN;
delete process.env.ANTHROPIC_API_KEY;

test('App ESC from home goes to exit', async () => {
  const { core } = makeCore();
  const app = render(
    React.createElement(App, {
      core,
      providers,
      initialRootDir: '/tmp/root',
      initialBinDir: '/tmp/bin',
    })
  );

  await tick();

  // Press ESC from home
  await send(app.stdin, KEYS.escape);

  const frame = app.lastFrame() || '';
  assert.ok(frame.includes('Goodbye'), 'Should show exit screen');

  app.unmount();
});

test('App ESC from quick-provider goes to home', async () => {
  const { core } = makeCore();
  const app = render(
    React.createElement(App, {
      core,
      providers,
      initialRootDir: '/tmp/root',
      initialBinDir: '/tmp/bin',
    })
  );

  await tick();

  // Go to quick setup (first item)
  await send(app.stdin, KEYS.enter);
  await tick();

  // Should be on provider select, press ESC
  await send(app.stdin, KEYS.escape);
  await tick();

  const frame = app.lastFrame() || '';
  assert.ok(frame.includes('Quick Setup'), 'Should be back at home screen');

  app.unmount();
});

test('App ESC from quick intro goes back to quick-provider', async () => {
  const { core } = makeCore();
  const app = render(
    React.createElement(App, {
      core,
      providers,
      initialRootDir: '/tmp/root',
      initialBinDir: '/tmp/bin',
    })
  );

  await tick();

  // Go to quick setup
  await send(app.stdin, KEYS.enter);
  await tick();

  // Select a provider
  await send(app.stdin, KEYS.enter);
  await tick();

  // Should be on provider intro screen, press ESC
  await send(app.stdin, KEYS.escape);
  await tick();

  const frame = app.lastFrame() || '';
  assert.ok(frame.includes('Select Provider'), 'Should be back at provider select');

  app.unmount();
});

test('App ESC from settings goes to home', async () => {
  const { core } = makeCore();
  const app = render(
    React.createElement(App, {
      core,
      providers,
      initialRootDir: '/tmp/root',
      initialBinDir: '/tmp/bin',
    })
  );

  await tick();

  // Navigate to Settings
  for (let i = 0; i < 5; i++) {
    await send(app.stdin, KEYS.down);
  }
  await send(app.stdin, KEYS.enter);
  await tick();

  // Should be on settings screen, press ESC
  await send(app.stdin, KEYS.escape);
  await tick();

  const frame = app.lastFrame() || '';
  assert.ok(frame.includes('Quick Setup'), 'Should be back at home screen');

  app.unmount();
});

test('App ESC from manage screen goes to home', async () => {
  const { core } = makeCore();
  const app = render(
    React.createElement(App, {
      core,
      providers,
      initialRootDir: '/tmp/root',
      initialBinDir: '/tmp/bin',
    })
  );

  await tick();

  // Navigate to Manage Variants
  await send(app.stdin, KEYS.down);
  await send(app.stdin, KEYS.down);
  await send(app.stdin, KEYS.enter);
  await tick();

  // Should be on manage screen, press ESC
  await send(app.stdin, KEYS.escape);
  await tick();

  const frame = app.lastFrame() || '';
  assert.ok(frame.includes('Quick Setup'), 'Should be back at home screen');

  app.unmount();
});

test('App ESC from doctor screen goes to home', async () => {
  const { core } = makeCore();
  const app = render(
    React.createElement(App, {
      core,
      providers,
      initialRootDir: '/tmp/root',
      initialBinDir: '/tmp/bin',
    })
  );

  await tick();

  // Navigate to Diagnostics
  for (let i = 0; i < 4; i++) {
    await send(app.stdin, KEYS.down);
  }
  await send(app.stdin, KEYS.enter);
  await tick();

  // Should be on diagnostics screen, press ESC
  await send(app.stdin, KEYS.escape);
  await tick();

  const frame = app.lastFrame() || '';
  assert.ok(frame.includes('Quick Setup'), 'Should be back at home screen');

  app.unmount();
});
