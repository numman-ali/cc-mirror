/**
 * VariantActionsScreen Tests
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { render } from 'ink-testing-library';
import { VariantActionsScreen } from '../../src/tui/screens/VariantActionsScreen.js';
import { tick, send, KEYS } from '../helpers/index.js';

test('VariantActionsScreen renders actions', async () => {
  const meta = {
    name: 'test-variant',
    provider: 'zai',
    binaryPath: '/tmp/test',
    configDir: '/tmp/test/config',
    wrapperPath: '/tmp/bin/test',
  };

  const app = render(
    React.createElement(VariantActionsScreen, {
      meta,
      onUpdate: () => {},
      onTweak: () => {},
      onRemove: () => {},
      onBack: () => {},
    })
  );

  const frame = app.lastFrame() || '';

  assert.ok(frame.includes('test-variant'), 'Variant name should be visible');
  assert.ok(frame.includes('Update'), 'Update action should be visible');
  assert.ok(frame.includes('Customize'), 'Customize action should be visible');
  assert.ok(frame.includes('Remove'), 'Remove action should be visible');
  assert.ok(frame.includes('Back'), 'Back action should be visible');

  app.unmount();
});

test('VariantActionsScreen action selection', async () => {
  const meta = {
    name: 'test-variant',
    binaryPath: '/tmp/test',
    configDir: '/tmp/test/config',
    wrapperPath: '/tmp/bin/test',
  };

  let updateCalled = false;

  const app = render(
    React.createElement(VariantActionsScreen, {
      meta,
      onUpdate: () => {
        updateCalled = true;
      },
      onTweak: () => {},
      onRemove: () => {},
      onBack: () => {},
    })
  );

  await tick();

  // First item is Update - press enter
  await send(app.stdin, KEYS.enter);

  assert.equal(updateCalled, true, 'Update should be called');

  app.unmount();
});

test('VariantActionsScreen shows team mode toggle when handler provided', async () => {
  const meta = {
    name: 'test-variant',
    binaryPath: '/tmp/test',
    configDir: '/tmp/test/config',
    wrapperPath: '/tmp/bin/test',
    teamModeEnabled: false,
  };

  const app = render(
    React.createElement(VariantActionsScreen, {
      meta,
      onUpdate: () => {},
      onTweak: () => {},
      onRemove: () => {},
      onToggleTeamMode: () => {},
      onBack: () => {},
    })
  );

  const frame = app.lastFrame() || '';

  assert.ok(frame.includes('Enable Team Mode'), 'Enable Team Mode should be visible when disabled');
  assert.ok(frame.includes('Team Mode') && frame.includes('Disabled'), 'Team mode status should show Disabled');

  app.unmount();
});

test('VariantActionsScreen shows disable option when team mode enabled', async () => {
  const meta = {
    name: 'test-variant',
    binaryPath: '/tmp/test',
    configDir: '/tmp/test/config',
    wrapperPath: '/tmp/bin/test',
    teamModeEnabled: true,
  };

  const app = render(
    React.createElement(VariantActionsScreen, {
      meta,
      onUpdate: () => {},
      onTweak: () => {},
      onRemove: () => {},
      onToggleTeamMode: () => {},
      onBack: () => {},
    })
  );

  const frame = app.lastFrame() || '';

  assert.ok(frame.includes('Disable Team Mode'), 'Disable Team Mode should be visible when enabled');
  assert.ok(frame.includes('Team Mode') && frame.includes('Enabled'), 'Team mode status should show Enabled');

  app.unmount();
});

test('VariantActionsScreen team mode toggle calls handler', async () => {
  const meta = {
    name: 'test-variant',
    binaryPath: '/tmp/test',
    configDir: '/tmp/test/config',
    wrapperPath: '/tmp/bin/test',
    teamModeEnabled: false,
  };

  let toggleCalled = false;

  const app = render(
    React.createElement(VariantActionsScreen, {
      meta,
      onUpdate: () => {},
      onTweak: () => {},
      onRemove: () => {},
      onToggleTeamMode: () => {
        toggleCalled = true;
      },
      onBack: () => {},
    })
  );

  await tick();

  // Navigate down to team mode option (Update -> Team Mode)
  await send(app.stdin, KEYS.down);
  await send(app.stdin, KEYS.enter);

  assert.equal(toggleCalled, true, 'Team mode toggle should be called');

  app.unmount();
});
