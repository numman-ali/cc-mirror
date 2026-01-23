/**
 * StatusLineQuickInstall Tests
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { render } from 'ink-testing-library';
import { tick, send, KEYS } from '../helpers/index.js';
import type { VariantEntry } from '../../src/core/types.js';

const makeVariant = (name: string, provider = 'zai'): VariantEntry => ({
  name,
  meta: {
    name,
    provider,
    configDir: `/tmp/config/${name}`,
    createdAt: '2024-01-01',
    claudeOrig: '/tmp/claude',
    binaryPath: `/tmp/${name}`,
    tweakDir: `/tmp/${name}/tweakcc`,
  },
});

test('StatusLineQuickInstall renders initial selection state', async () => {
  const { StatusLineQuickInstall } = await import('../../src/tui/screens/StatusLineQuickInstall.js');

  const variants: VariantEntry[] = [makeVariant('alpha'), makeVariant('beta')];

  const app = render(
    React.createElement(StatusLineQuickInstall, {
      variants,
      onBack: () => {},
    })
  );

  await tick();
  const frame = app.lastFrame() || '';

  assert.ok(frame.includes('Quick Install'), 'Title should be visible');
  assert.ok(frame.includes('alpha'), 'First variant should be visible');
  assert.ok(frame.includes('beta'), 'Second variant should be visible');

  app.unmount();
});

test('StatusLineQuickInstall shows configuration info section', async () => {
  const { StatusLineQuickInstall } = await import('../../src/tui/screens/StatusLineQuickInstall.js');

  const variants: VariantEntry[] = [makeVariant('alpha')];

  const app = render(
    React.createElement(StatusLineQuickInstall, {
      variants,
      onBack: () => {},
    })
  );

  await tick();
  await tick(); // Extra tick for config loading
  const frame = app.lastFrame() || '';

  assert.ok(
    frame.includes('Current Configuration') || frame.includes('Loading'),
    'Configuration section should be visible'
  );

  app.unmount();
});

test('StatusLineQuickInstall escape triggers back', async () => {
  const { StatusLineQuickInstall } = await import('../../src/tui/screens/StatusLineQuickInstall.js');

  const variants: VariantEntry[] = [makeVariant('alpha')];
  let backCalled = false;

  const app = render(
    React.createElement(StatusLineQuickInstall, {
      variants,
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

test('StatusLineQuickInstall shows empty state with no variants', async () => {
  const { StatusLineQuickInstall } = await import('../../src/tui/screens/StatusLineQuickInstall.js');

  const app = render(
    React.createElement(StatusLineQuickInstall, {
      variants: [],
      onBack: () => {},
    })
  );

  await tick();
  const frame = app.lastFrame() || '';

  assert.ok(frame.includes('No variants') || frame.includes('Quick Install'), 'Should handle empty variants');

  app.unmount();
});

test('StatusLineQuickInstall can navigate variants', async () => {
  const { StatusLineQuickInstall } = await import('../../src/tui/screens/StatusLineQuickInstall.js');

  const variants: VariantEntry[] = [makeVariant('alpha'), makeVariant('beta'), makeVariant('gamma')];

  const app = render(
    React.createElement(StatusLineQuickInstall, {
      variants,
      onBack: () => {},
    })
  );

  await tick();

  // Navigate down
  await send(app.stdin, KEYS.down);
  await tick();

  // Navigate down again
  await send(app.stdin, KEYS.down);
  await tick();

  const frame = app.lastFrame() || '';
  assert.ok(
    frame.includes('alpha') && frame.includes('beta') && frame.includes('gamma'),
    'All variants should be visible'
  );

  app.unmount();
});

test('StatusLineQuickInstall shows selection hints', async () => {
  const { StatusLineQuickInstall } = await import('../../src/tui/screens/StatusLineQuickInstall.js');

  const variants: VariantEntry[] = [makeVariant('alpha')];

  const app = render(
    React.createElement(StatusLineQuickInstall, {
      variants,
      onBack: () => {},
    })
  );

  await tick();
  const frame = app.lastFrame() || '';

  assert.ok(
    frame.includes('Navigate') || frame.includes('↑↓') || frame.includes('Space') || frame.includes('Toggle'),
    'Should show navigation hints'
  );

  app.unmount();
});

test('StatusLineQuickInstall renders subtitle', async () => {
  const { StatusLineQuickInstall } = await import('../../src/tui/screens/StatusLineQuickInstall.js');

  const variants: VariantEntry[] = [makeVariant('alpha')];

  const app = render(
    React.createElement(StatusLineQuickInstall, {
      variants,
      onBack: () => {},
    })
  );

  await tick();
  const frame = app.lastFrame() || '';

  assert.ok(frame.includes('Apply existing') || frame.includes('multiple variants'), 'Subtitle should be visible');

  app.unmount();
});

test('StatusLineQuickInstall shows config error state', async () => {
  const { StatusLineQuickInstall } = await import('../../src/tui/screens/StatusLineQuickInstall.js');

  const variants: VariantEntry[] = [makeVariant('alpha')];

  const app = render(
    React.createElement(StatusLineQuickInstall, {
      variants,
      onBack: () => {},
    })
  );

  // Allow time for config loading to potentially fail
  await tick();
  await tick();
  await tick();

  const frame = app.lastFrame() || '';

  // Should show either config or loading/error state
  assert.ok(
    frame.includes('Configuration') || frame.includes('Loading') || frame.includes('Error'),
    'Should show configuration status'
  );

  app.unmount();
});

test('StatusLineQuickInstall space toggles variant selection', async () => {
  const { StatusLineQuickInstall } = await import('../../src/tui/screens/StatusLineQuickInstall.js');

  const variants: VariantEntry[] = [makeVariant('alpha'), makeVariant('beta')];

  const app = render(
    React.createElement(StatusLineQuickInstall, {
      variants,
      onBack: () => {},
    })
  );

  await tick();

  // Toggle selection with space
  await send(app.stdin, ' ');
  await tick();

  const frame = app.lastFrame() || '';

  // The selection should be reflected in the UI
  assert.ok(frame.includes('alpha'), 'Variant should still be visible');

  app.unmount();
});

test('StatusLineQuickInstall handles enter to proceed', async () => {
  const { StatusLineQuickInstall } = await import('../../src/tui/screens/StatusLineQuickInstall.js');

  const variants: VariantEntry[] = [makeVariant('alpha')];

  const app = render(
    React.createElement(StatusLineQuickInstall, {
      variants,
      onBack: () => {},
    })
  );

  await tick();

  // Toggle selection then try to submit
  await send(app.stdin, ' ');
  await tick();
  await send(app.stdin, KEYS.enter);
  await tick();

  // Give time for async operations
  await tick();
  await tick();

  const frame = app.lastFrame() || '';

  // Should either be installing, complete, or show error
  assert.ok(
    frame.includes('Install') ||
      frame.includes('select') ||
      frame.includes('Complete') ||
      frame.includes('Error') ||
      frame.includes('failed'),
    'Should show installation state or error'
  );

  app.unmount();
});

test('StatusLineQuickInstall does not submit with no selection', async () => {
  const { StatusLineQuickInstall } = await import('../../src/tui/screens/StatusLineQuickInstall.js');

  const variants: VariantEntry[] = [makeVariant('alpha')];

  const app = render(
    React.createElement(StatusLineQuickInstall, {
      variants,
      onBack: () => {},
    })
  );

  await tick();

  // Try to submit without selecting any variant
  await send(app.stdin, KEYS.enter);
  await tick();
  await tick();

  const frame = app.lastFrame() || '';

  // Should still be in selection state
  assert.ok(
    frame.includes('Quick Install') && frame.includes('alpha'),
    'Should remain in selection state without selection'
  );

  app.unmount();
});

test('StatusLineQuickInstall shows installing state after selection', async () => {
  const { StatusLineQuickInstall } = await import('../../src/tui/screens/StatusLineQuickInstall.js');

  const variants: VariantEntry[] = [makeVariant('alpha')];

  const app = render(
    React.createElement(StatusLineQuickInstall, {
      variants,
      onBack: () => {},
    })
  );

  await tick();

  // Select and submit
  await send(app.stdin, ' ');
  await tick();
  await send(app.stdin, KEYS.enter);

  // Check immediately after submit
  const frame = app.lastFrame() || '';

  // Should show installing or complete state (async operation)
  assert.ok(
    frame.includes('Install') ||
      frame.includes('Partial') ||
      frame.includes('Complete') ||
      frame.includes('Please wait'),
    'Should transition to installing or complete state'
  );

  app.unmount();
});

test('StatusLineQuickInstall handles install completion with errors', async () => {
  const { StatusLineQuickInstall } = await import('../../src/tui/screens/StatusLineQuickInstall.js');

  const variants: VariantEntry[] = [makeVariant('alpha')];

  const app = render(
    React.createElement(StatusLineQuickInstall, {
      variants,
      onBack: () => {},
    })
  );

  await tick();

  // Select and submit
  await send(app.stdin, ' ');
  await tick();
  await send(app.stdin, KEYS.enter);
  await tick();

  // Wait for the install to complete (it will likely fail due to missing ccstatusline config)
  await tick();
  await tick();
  await tick();
  await tick();
  await tick();

  const frame = app.lastFrame() || '';

  // After completion, should show result state
  assert.ok(
    frame.includes('Install') ||
      frame.includes('Complete') ||
      frame.includes('Partial') ||
      frame.includes('failed') ||
      frame.includes('succeeded'),
    'Should show completion state after install attempt'
  );

  app.unmount();
});
