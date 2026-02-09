/**
 * Input Component Regression Tests
 *
 * Ensure long pastes are not truncated when delivered in multiple chunks.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import React, { useEffect, useState } from 'react';
import { render } from 'ink-testing-library';
import { MaskedInput } from '../../src/tui/components/ui/Input.js';
import { tick } from '../helpers/index.js';

test('MaskedInput preserves long pastes across multiple chunks', async () => {
  let latest = '';

  const Harness = () => {
    const [value, setValue] = useState('');
    useEffect(() => {
      latest = value;
    }, [value]);
    return React.createElement(MaskedInput, {
      label: 'Authentication',
      envVarName: 'ANTHROPIC_API_KEY',
      value,
      onChange: setValue,
      onSubmit: () => {},
    });
  };

  const app = render(React.createElement(Harness));

  // Write two chunks without waiting (simulates a paste split by the terminal/runtime).
  app.stdin.write('sk-test-');
  app.stdin.write('this-is-a-very-long-api-key-that-should-not-get-truncated-0123456789');

  await tick();

  assert.equal(
    latest,
    'sk-test-this-is-a-very-long-api-key-that-should-not-get-truncated-0123456789',
    'Should preserve full input across chunked paste'
  );

  app.unmount();
});
