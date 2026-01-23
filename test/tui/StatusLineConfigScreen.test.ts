/**
 * StatusLineConfigScreen Tests
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { render } from 'ink-testing-library';
import { tick } from '../helpers/index.js';
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

test('StatusLineConfigScreen shows error when no valid variant selected', async () => {
  const { StatusLineConfigScreen } = await import('../../src/tui/screens/StatusLineConfigScreen.js');

  const variants: VariantEntry[] = [{ name: 'alpha', meta: null }];

  const app = render(
    React.createElement(StatusLineConfigScreen, {
      variants,
      selectedVariants: ['alpha'],
      onBack: () => {},
    })
  );

  await tick();
  const frame = app.lastFrame() || '';

  assert.ok(frame.includes('Error'), 'Error message should be visible');
  assert.ok(frame.includes('No valid variant'), 'Should show no valid variant message');

  app.unmount();
});

test('StatusLineConfigScreen shows error when selected variant not found', async () => {
  const { StatusLineConfigScreen } = await import('../../src/tui/screens/StatusLineConfigScreen.js');

  const variants: VariantEntry[] = [makeVariant('alpha')];

  const app = render(
    React.createElement(StatusLineConfigScreen, {
      variants,
      selectedVariants: ['nonexistent'],
      onBack: () => {},
    })
  );

  await tick();
  const frame = app.lastFrame() || '';

  assert.ok(frame.includes('Error'), 'Error message should be visible when variant not found');

  app.unmount();
});

test('StatusLineConfigScreen shows error with empty selectedVariants', async () => {
  const { StatusLineConfigScreen } = await import('../../src/tui/screens/StatusLineConfigScreen.js');

  const variants: VariantEntry[] = [makeVariant('alpha')];

  const app = render(
    React.createElement(StatusLineConfigScreen, {
      variants,
      selectedVariants: [],
      onBack: () => {},
    })
  );

  await tick();
  const frame = app.lastFrame() || '';

  assert.ok(frame.includes('Error'), 'Error message should be visible with empty selection');

  app.unmount();
});

test('StatusLineConfigScreen renders with valid variant', async () => {
  const { StatusLineConfigScreen } = await import('../../src/tui/screens/StatusLineConfigScreen.js');

  const variants: VariantEntry[] = [makeVariant('alpha')];

  const app = render(
    React.createElement(StatusLineConfigScreen, {
      variants,
      selectedVariants: ['alpha'],
      onBack: () => {},
    })
  );

  await tick();
  const frame = app.lastFrame() || '';

  assert.ok(!frame.includes('No valid variant'), 'Should not show invalid variant error');

  app.unmount();
});

test('StatusLineConfigScreen shows multi-variant banner when multiple variants selected', async () => {
  const { StatusLineConfigScreen } = await import('../../src/tui/screens/StatusLineConfigScreen.js');

  const variants: VariantEntry[] = [makeVariant('alpha'), makeVariant('beta', 'minimax')];

  const app = render(
    React.createElement(StatusLineConfigScreen, {
      variants,
      selectedVariants: ['alpha', 'beta'],
      onBack: () => {},
    })
  );

  await tick();
  const frame = app.lastFrame() || '';

  assert.ok(frame.includes('2 variants') || frame.includes('Configuring'), 'Should show multi-variant indicator');

  app.unmount();
});
