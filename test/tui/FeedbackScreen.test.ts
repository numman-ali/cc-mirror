/**
 * FeedbackScreen Tests
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { render } from 'ink-testing-library';
import { FeedbackScreen } from '../../src/tui/screens/FeedbackScreen.js';
import { tick, send, KEYS } from '../helpers/index.js';

test('FeedbackScreen renders and handles back', async () => {
  let backCount = 0;
  const app = render(
    React.createElement(FeedbackScreen, {
      onBack: () => {
        backCount += 1;
      },
    })
  );

  await tick();
  const output = app.lastFrame() ?? '';
  assert.ok(output.includes('Feedback'), 'Should render feedback header');

  await send(app.stdin, KEYS.escape);
  assert.equal(backCount, 1, 'Should call onBack on escape');

  app.unmount();
});
