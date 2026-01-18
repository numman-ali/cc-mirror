/**
 * ModelConfigScreen Interaction Tests
 *
 * Tests the model configuration screen for proper:
 * - Field rendering
 * - Navigation between fields
 * - Input handling
 * - State synchronization (prevents useEffect loops)
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { render } from 'ink-testing-library';
import { ModelConfigScreen } from '../../src/tui/screens/ModelConfigScreen.js';
import { tick, send, waitFor, KEYS } from '../helpers/index.js';

test('ModelConfigScreen renders all three model fields', async () => {
  const app = render(
    React.createElement(ModelConfigScreen, {
      opusValue: '',
      sonnetValue: '',
      haikuValue: '',
      onOpusChange: () => {},
      onSonnetChange: () => {},
      onHaikuChange: () => {},
      onComplete: () => {},
    })
  );

  await tick();
  const output = app.lastFrame() ?? '';

  assert.ok(output.includes('Opus'), 'Should show Opus field');
  assert.ok(output.includes('Sonnet'), 'Should show Sonnet field');
  assert.ok(output.includes('Haiku'), 'Should show Haiku field');

  app.unmount();
});

test('ModelConfigScreen tab navigates between fields', async () => {
  const callbacks = {
    opus: 0,
    sonnet: 0,
    haiku: 0,
  };

  const app = render(
    React.createElement(ModelConfigScreen, {
      opusValue: 'opus-model',
      sonnetValue: 'sonnet-model',
      haikuValue: 'haiku-model',
      onOpusChange: () => {
        callbacks.opus++;
      },
      onSonnetChange: () => {
        callbacks.sonnet++;
      },
      onHaikuChange: () => {
        callbacks.haiku++;
      },
      onComplete: () => {},
    })
  );

  await tick();

  // Tab should save current field and move to next
  await send(app.stdin, KEYS.tab);
  await tick();

  // Should have called onOpusChange when leaving opus field
  assert.ok(callbacks.opus >= 1, 'Should call onOpusChange when tabbing away');

  app.unmount();
});

test('ModelConfigScreen typing updates input', async () => {
  let currentOpus = '';

  const app = render(
    React.createElement(ModelConfigScreen, {
      opusValue: currentOpus,
      sonnetValue: '',
      haikuValue: '',
      onOpusChange: (v) => {
        currentOpus = v;
      },
      onSonnetChange: () => {},
      onHaikuChange: () => {},
      onComplete: () => {},
    })
  );

  await tick();

  // Type some characters
  await send(app.stdin, 'test-model');
  await tick();

  // Tab to save the value
  await send(app.stdin, KEYS.tab);
  await tick();

  assert.equal(currentOpus, 'test-model', 'Should capture typed input');

  app.unmount();
});

test('ModelConfigScreen enter submits when all fields filled', async () => {
  let completed = false;

  const app = render(
    React.createElement(ModelConfigScreen, {
      opusValue: 'opus',
      sonnetValue: 'sonnet',
      haikuValue: 'haiku',
      onOpusChange: () => {},
      onSonnetChange: () => {},
      onHaikuChange: () => {},
      onComplete: () => {
        completed = true;
      },
    })
  );

  await tick();

  // Press enter
  await send(app.stdin, KEYS.enter);
  const completedOk = await waitFor(() => completed);
  assert.ok(completedOk, 'Should call onComplete when all fields are filled');

  app.unmount();
});

test('ModelConfigScreen escape calls onBack', async () => {
  let backCalled = false;

  const app = render(
    React.createElement(ModelConfigScreen, {
      opusValue: '',
      sonnetValue: '',
      haikuValue: '',
      onOpusChange: () => {},
      onSonnetChange: () => {},
      onHaikuChange: () => {},
      onComplete: () => {},
      onBack: () => {
        backCalled = true;
      },
    })
  );

  await tick();

  // Press escape
  await send(app.stdin, KEYS.escape);
  const backOk = await waitFor(() => backCalled);
  assert.ok(backOk, 'Should call onBack on escape');

  app.unmount();
});

test('ModelConfigScreen shows placeholder for provider', async () => {
  const app = render(
    React.createElement(ModelConfigScreen, {
      providerKey: 'openrouter',
      opusValue: '',
      sonnetValue: '',
      haikuValue: '',
      onOpusChange: () => {},
      onSonnetChange: () => {},
      onHaikuChange: () => {},
      onComplete: () => {},
    })
  );

  await tick();
  const output = app.lastFrame() ?? '';

  // OpenRouter placeholders should mention anthropic
  assert.ok(
    output.includes('anthropic') || output.includes('placeholder'),
    'Should show provider-specific placeholder'
  );

  app.unmount();
});

test('ModelConfigScreen does not submit with empty fields', async () => {
  let completed = false;

  const app = render(
    React.createElement(ModelConfigScreen, {
      opusValue: 'opus',
      sonnetValue: '', // Empty!
      haikuValue: 'haiku',
      onOpusChange: () => {},
      onSonnetChange: () => {},
      onHaikuChange: () => {},
      onComplete: () => {
        completed = true;
      },
    })
  );

  await tick();

  // Press enter - should NOT complete because sonnet is empty
  await send(app.stdin, KEYS.enter);
  await tick();

  assert.ok(!completed, 'Should NOT call onComplete when fields are empty');

  app.unmount();
});

test('ModelConfigScreen arrow keys navigate fields', async () => {
  let opusChanges = 0;

  const app = render(
    React.createElement(ModelConfigScreen, {
      opusValue: 'opus',
      sonnetValue: 'sonnet',
      haikuValue: 'haiku',
      onOpusChange: () => {
        opusChanges++;
      },
      onSonnetChange: () => {},
      onHaikuChange: () => {},
      onComplete: () => {},
    })
  );

  await tick();

  // Down arrow should move to sonnet field
  await send(app.stdin, KEYS.down);
  await tick();

  // Should have called onOpusChange (to save) when moving away
  assert.ok(opusChanges >= 1, 'Down arrow should save current field');

  app.unmount();
});
