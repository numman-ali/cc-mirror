/**
 * HomeScreen Tests
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { render } from 'ink-testing-library';
import { HomeScreen } from '../../src/tui/screens/HomeScreen.js';
import { icons } from '../../src/tui/components/ui/theme.js';
import { tick, send, waitFor, KEYS } from '../helpers/index.js';

test('HomeScreen renders with logo and menu items', async () => {
  let _selectedValue = '';
  const app = render(
    React.createElement(HomeScreen, {
      onSelect: (value: string) => {
        _selectedValue = value;
      },
    })
  );

  const frame = app.lastFrame() || '';

  // Check logo is rendered (ASCII art contains block characters and MIRROR text)
  assert.ok(frame.includes('MIRROR') || frame.includes('██'), 'Logo should be rendered');

  // Check menu items
  assert.ok(frame.includes('Quick Setup'), 'Quick Setup menu item should be visible');
  assert.ok(frame.includes('New Variant'), 'New Variant menu item should be visible');
  assert.ok(frame.includes('Manage Variants'), 'Manage Variants menu item should be visible');
  assert.ok(frame.includes('Until next time'), 'Exit menu item should be visible');

  app.unmount();
});

test('HomeScreen arrow navigation moves selection', async () => {
  let selectedValue = '';
  const app = render(
    React.createElement(HomeScreen, {
      onSelect: (value: string) => {
        selectedValue = value;
      },
    })
  );

  await tick();

  // Press down to move to New Variant
  await send(app.stdin, KEYS.down);

  // Press enter to select
  await send(app.stdin, KEYS.enter);

  assert.equal(selectedValue, 'create', 'New Variant should be selected');

  app.unmount();
});

test('HomeScreen quick setup is first item and selectable', async () => {
  let selectedValue = '';
  const app = render(
    React.createElement(HomeScreen, {
      onSelect: (value: string) => {
        selectedValue = value;
      },
    })
  );

  await tick();

  // Press enter immediately (first item is Quick Setup)
  await send(app.stdin, KEYS.enter);

  assert.equal(selectedValue, 'quick', 'Quick Setup should be first item');

  app.unmount();
});

test('Menu wrap-around navigation works correctly', async () => {
  let selectedValue = '';
  const app = render(
    React.createElement(HomeScreen, {
      onSelect: (value: string) => {
        selectedValue = value;
      },
    })
  );

  await tick();

  // Navigate up from first item (should wrap to last - Exit)
  await send(app.stdin, KEYS.up);
  const moved = await waitFor(() => (app.lastFrame() || '').includes(`${icons.pointer} Until next time`));
  assert.ok(moved, 'Selection should wrap to Exit');
  await send(app.stdin, KEYS.enter);

  assert.equal(selectedValue, 'exit', 'Should wrap to Exit');

  app.unmount();
});
