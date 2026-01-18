/**
 * RouterUrlScreen Tests
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { render } from 'ink-testing-library';
import { RouterUrlScreen } from '../../src/tui/screens/RouterUrlScreen.js';
import { tick, send, KEYS } from '../helpers/index.js';

test('RouterUrlScreen renders and submits input', async () => {
  let latestValue = '';
  let submitted = false;

  const app = render(
    React.createElement(RouterUrlScreen, {
      value: latestValue,
      onChange: (value: string) => {
        latestValue = value;
      },
      onSubmit: () => {
        submitted = true;
      },
      onBack: () => {},
    })
  );

  await tick();
  const output = app.lastFrame() ?? '';
  assert.ok(output.includes('Router URL'), 'Should render router header');

  await send(app.stdin, 'http://127.0.0.1:3456');
  await send(app.stdin, KEYS.enter);

  assert.equal(latestValue, 'http://127.0.0.1:3456');
  assert.ok(submitted, 'Should submit on enter');

  app.unmount();
});

test('RouterUrlScreen handles escape', async () => {
  let backCount = 0;

  const app = render(
    React.createElement(RouterUrlScreen, {
      value: '',
      onChange: () => {},
      onSubmit: () => {},
      onBack: () => {
        backCount += 1;
      },
    })
  );

  await tick();
  await send(app.stdin, KEYS.escape);

  assert.equal(backCount, 1, 'Should call onBack on escape');

  app.unmount();
});
