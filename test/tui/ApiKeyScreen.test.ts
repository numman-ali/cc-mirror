import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { render } from 'ink-testing-library';
import { ApiKeyScreen } from '../../src/tui/screens/ApiKeyScreen.js';
import { tick } from '../helpers/index.js';

test('ApiKeyScreen shows auth-token links for Vercel', async () => {
  const app = render(
    React.createElement(ApiKeyScreen, {
      providerLabel: 'Vercel AI Gateway',
      providerKey: 'vercel',
      envVarName: 'ANTHROPIC_AUTH_TOKEN',
      value: '',
      onChange: () => {},
      onSubmit: () => {},
    })
  );

  await tick();
  const output = app.lastFrame() ?? '';

  assert.ok(output.includes('Auth Token'), 'should show auth token title');
  assert.ok(output.includes('https://vercel.com/ai'), 'should show subscribe URL');
  assert.ok(output.includes('https://vercel.com/account/tokens'), 'should show credential URL');
  assert.ok(output.includes('https://vercel.com/docs/ai-gateway'), 'should show docs URL');

  app.unmount();
});

test('ApiKeyScreen falls back to generic guidance when provider links are missing', async () => {
  const app = render(
    React.createElement(ApiKeyScreen, {
      providerLabel: 'Unknown Provider',
      providerKey: 'unknown',
      envVarName: 'ANTHROPIC_API_KEY',
      value: '',
      onChange: () => {},
      onSubmit: () => {},
    })
  );

  await tick();
  const output = app.lastFrame() ?? '';

  assert.ok(output.includes("Get your API key from your provider's dashboard"), 'should show generic fallback help');

  app.unmount();
});
