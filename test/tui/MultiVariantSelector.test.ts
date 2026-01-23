/**
 * MultiVariantSelector Tests
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { render } from 'ink-testing-library';
import { MultiVariantSelector } from '../../src/tui/screens/MultiVariantSelector.js';
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

test('MultiVariantSelector renders variant list', async () => {
  const variants: VariantEntry[] = [makeVariant('alpha'), makeVariant('beta', 'minimax')];

  const app = render(
    React.createElement(MultiVariantSelector, {
      variants,
      selectedVariants: [],
      onSelectionChange: () => {},
      onSubmit: () => {},
      onBack: () => {},
      allowMultiple: true,
    })
  );

  const frame = app.lastFrame() || '';

  assert.ok(frame.includes('Select Variants'), 'Title should be visible');
  assert.ok(frame.includes('alpha'), 'First variant should be visible');
  assert.ok(frame.includes('beta'), 'Second variant should be visible');
  assert.ok(frame.includes('Back'), 'Back option should be visible');

  app.unmount();
});

test('MultiVariantSelector shows single selection title when allowMultiple is false', async () => {
  const variants: VariantEntry[] = [makeVariant('alpha')];

  const app = render(
    React.createElement(MultiVariantSelector, {
      variants,
      selectedVariants: [],
      onSelectionChange: () => {},
      onSubmit: () => {},
      onBack: () => {},
      allowMultiple: false,
    })
  );

  const frame = app.lastFrame() || '';

  assert.ok(frame.includes('Select Variant'), 'Single selection title should be visible');

  app.unmount();
});

test('MultiVariantSelector space toggles selection in multi mode', async () => {
  const variants: VariantEntry[] = [makeVariant('alpha'), makeVariant('beta')];
  let selected: string[] = [];

  const app = render(
    React.createElement(MultiVariantSelector, {
      variants,
      selectedVariants: selected,
      onSelectionChange: (s) => {
        selected = s;
      },
      onSubmit: () => {},
      onBack: () => {},
      allowMultiple: true,
    })
  );

  await tick();

  await send(app.stdin, ' ');

  assert.deepEqual(selected, ['alpha'], 'First variant should be selected');

  app.unmount();
});

test('MultiVariantSelector enter submits in multi mode with selection', async () => {
  const variants: VariantEntry[] = [makeVariant('alpha')];
  let submitted = false;

  const app = render(
    React.createElement(MultiVariantSelector, {
      variants,
      selectedVariants: ['alpha'],
      onSelectionChange: () => {},
      onSubmit: () => {
        submitted = true;
      },
      onBack: () => {},
      allowMultiple: true,
    })
  );

  await tick();
  await send(app.stdin, KEYS.enter);

  assert.equal(submitted, true, 'Submit should be called');

  app.unmount();
});

test('MultiVariantSelector enter does not submit without selection in multi mode', async () => {
  const variants: VariantEntry[] = [makeVariant('alpha')];
  let submitted = false;

  const app = render(
    React.createElement(MultiVariantSelector, {
      variants,
      selectedVariants: [],
      onSelectionChange: () => {},
      onSubmit: () => {
        submitted = true;
      },
      onBack: () => {},
      allowMultiple: true,
    })
  );

  await tick();
  await send(app.stdin, KEYS.enter);

  assert.equal(submitted, false, 'Submit should not be called without selection');

  app.unmount();
});

test('MultiVariantSelector enter selects and submits in single mode', async () => {
  const variants: VariantEntry[] = [makeVariant('alpha'), makeVariant('beta')];
  let selected: string[] = [];
  let submitted = false;

  const app = render(
    React.createElement(MultiVariantSelector, {
      variants,
      selectedVariants: selected,
      onSelectionChange: (s) => {
        selected = s;
      },
      onSubmit: () => {
        submitted = true;
      },
      onBack: () => {},
      allowMultiple: false,
    })
  );

  await tick();
  await send(app.stdin, KEYS.enter);

  assert.deepEqual(selected, ['alpha'], 'First variant should be selected');
  assert.equal(submitted, true, 'Submit should be called');

  app.unmount();
});

test('MultiVariantSelector escape triggers back', async () => {
  const variants: VariantEntry[] = [makeVariant('alpha')];
  let backCalled = false;

  const app = render(
    React.createElement(MultiVariantSelector, {
      variants,
      selectedVariants: [],
      onSelectionChange: () => {},
      onSubmit: () => {},
      onBack: () => {
        backCalled = true;
      },
      allowMultiple: true,
    })
  );

  await tick();
  await send(app.stdin, KEYS.escape);

  assert.equal(backCalled, true, 'ESC should trigger back');

  app.unmount();
});

test('MultiVariantSelector arrow navigation works', async () => {
  const variants: VariantEntry[] = [makeVariant('alpha'), makeVariant('beta')];
  let selected: string[] = [];

  const app = render(
    React.createElement(MultiVariantSelector, {
      variants,
      selectedVariants: selected,
      onSelectionChange: (s) => {
        selected = s;
      },
      onSubmit: () => {},
      onBack: () => {},
      allowMultiple: false,
    })
  );

  await tick();
  await send(app.stdin, KEYS.down);
  await send(app.stdin, KEYS.enter);

  assert.deepEqual(selected, ['beta'], 'Second variant should be selected after down arrow');

  app.unmount();
});

test('MultiVariantSelector shows empty state when no variants', async () => {
  const app = render(
    React.createElement(MultiVariantSelector, {
      variants: [],
      selectedVariants: [],
      onSelectionChange: () => {},
      onSubmit: () => {},
      onBack: () => {},
      allowMultiple: true,
    })
  );

  const frame = app.lastFrame() || '';

  assert.ok(frame.includes('No variants available'), 'Empty state should be visible');

  app.unmount();
});

test('MultiVariantSelector back button works when focused', async () => {
  const variants: VariantEntry[] = [makeVariant('alpha')];
  let backCalled = false;

  const app = render(
    React.createElement(MultiVariantSelector, {
      variants,
      selectedVariants: [],
      onSelectionChange: () => {},
      onSubmit: () => {},
      onBack: () => {
        backCalled = true;
      },
      allowMultiple: true,
    })
  );

  await tick();

  // Navigate to back button (variants.length items, then back)
  await send(app.stdin, KEYS.down);
  await send(app.stdin, KEYS.enter);

  assert.equal(backCalled, true, 'Back should be triggered when back button selected');

  app.unmount();
});

test('MultiVariantSelector wraps navigation at boundaries', async () => {
  const variants: VariantEntry[] = [makeVariant('alpha')];
  let backCalled = false;

  const app = render(
    React.createElement(MultiVariantSelector, {
      variants,
      selectedVariants: [],
      onSelectionChange: () => {},
      onSubmit: () => {},
      onBack: () => {
        backCalled = true;
      },
      allowMultiple: true,
    })
  );

  await tick();

  // Navigate up from first item should wrap to back button
  await send(app.stdin, KEYS.up);
  await send(app.stdin, KEYS.enter);

  assert.equal(backCalled, true, 'Up arrow should wrap to back button');

  app.unmount();
});

test('MultiVariantSelector shows selected count in multi mode', async () => {
  const variants: VariantEntry[] = [makeVariant('alpha'), makeVariant('beta')];

  const app = render(
    React.createElement(MultiVariantSelector, {
      variants,
      selectedVariants: ['alpha', 'beta'],
      onSelectionChange: () => {},
      onSubmit: () => {},
      onBack: () => {},
      allowMultiple: true,
    })
  );

  const frame = app.lastFrame() || '';

  assert.ok(frame.includes('2 selected'), 'Selected count should be visible');

  app.unmount();
});

test('MultiVariantSelector space replaces selection in single mode', async () => {
  const variants: VariantEntry[] = [makeVariant('alpha'), makeVariant('beta')];
  let selected: string[] = ['alpha'];

  const app = render(
    React.createElement(MultiVariantSelector, {
      variants,
      selectedVariants: selected,
      onSelectionChange: (s) => {
        selected = s;
      },
      onSubmit: () => {},
      onBack: () => {},
      allowMultiple: false,
    })
  );

  await tick();
  await send(app.stdin, KEYS.down);
  await send(app.stdin, ' ');

  assert.deepEqual(selected, ['beta'], 'Selection should be replaced in single mode');

  app.unmount();
});

test('MultiVariantSelector shows provider info when available', async () => {
  const variants: VariantEntry[] = [makeVariant('alpha', 'openrouter')];

  const app = render(
    React.createElement(MultiVariantSelector, {
      variants,
      selectedVariants: [],
      onSelectionChange: () => {},
      onSubmit: () => {},
      onBack: () => {},
      allowMultiple: true,
    })
  );

  const frame = app.lastFrame() || '';

  assert.ok(frame.includes('Provider'), 'Provider label should be visible');
  assert.ok(frame.includes('openrouter'), 'Provider name should be visible');

  app.unmount();
});
