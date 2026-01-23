/**
 * AboutScreen Tests
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { render } from 'ink-testing-library';
import { AboutScreen } from '../../src/tui/screens/AboutScreen.js';
import { tick, send, KEYS } from '../helpers/index.js';

test('AboutScreen renders guide view by default', async () => {
  const app = render(
    React.createElement(AboutScreen, {
      onBack: () => {},
    })
  );

  await tick();
  const frame = app.lastFrame() || '';

  assert.ok(frame.includes('About CC-MIRROR'), 'Title should be visible');
  assert.ok(frame.includes('How it works'), 'Guide subtitle should be visible');

  app.unmount();
});

test('AboutScreen escape triggers back', async () => {
  let backCalled = false;

  const app = render(
    React.createElement(AboutScreen, {
      onBack: () => {
        backCalled = true;
      },
    })
  );

  await tick();
  await send(app.stdin, KEYS.escape);

  assert.equal(backCalled, true, 'ESC should trigger back');

  app.unmount();
});

test('AboutScreen enter triggers back', async () => {
  let backCalled = false;

  const app = render(
    React.createElement(AboutScreen, {
      onBack: () => {
        backCalled = true;
      },
    })
  );

  await tick();
  await send(app.stdin, KEYS.enter);

  assert.equal(backCalled, true, 'Enter should trigger back');

  app.unmount();
});

test('AboutScreen toggles to poem view with ?', async () => {
  const app = render(
    React.createElement(AboutScreen, {
      onBack: () => {},
    })
  );

  await tick();

  // Toggle to poem view
  await send(app.stdin, '?');
  await tick();

  const frame = app.lastFrame() || '';

  assert.ok(frame.includes('poem') || frame.includes('mirror'), 'Should switch to poem view');

  app.unmount();
});

test('AboutScreen toggles view with tab', async () => {
  const app = render(
    React.createElement(AboutScreen, {
      onBack: () => {},
    })
  );

  await tick();

  // Toggle to poem view with tab
  await send(app.stdin, KEYS.tab);
  await tick();

  let frame = app.lastFrame() || '';

  // Should be in poem view
  assert.ok(frame.includes('Show guide') || frame.includes('poem'), 'Should switch to poem view with tab');

  // Toggle back to guide view
  await send(app.stdin, KEYS.tab);
  await tick();

  frame = app.lastFrame() || '';

  assert.ok(frame.includes('Show poem') || frame.includes('How it works'), 'Should switch back to guide view');

  app.unmount();
});

test('AboutScreen shows educational content in guide view', async () => {
  const app = render(
    React.createElement(AboutScreen, {
      onBack: () => {},
    })
  );

  await tick();
  const frame = app.lastFrame() || '';

  // Should show education sections
  assert.ok(
    frame.includes('CC-MIRROR') || frame.includes('Variant') || frame.includes('isolation'),
    'Should show educational content'
  );

  app.unmount();
});
