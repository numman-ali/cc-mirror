import test from 'node:test';
import assert from 'node:assert/strict';
import { getProvider, buildEnv } from '../../../src/providers/index.js';

test('Poe provider definition', async (t) => {
  await t.test('getProvider returns poe provider', () => {
    const provider = getProvider('poe');
    assert.ok(provider, 'poe provider should exist');
    assert.equal(provider.key, 'poe');
    assert.equal(provider.baseUrl, 'https://api.poe.com');
    assert.equal(provider.authMode, 'authToken');
  });

  await t.test('buildEnv sets ANTHROPIC_AUTH_TOKEN for poe', () => {
    const env = buildEnv({
      providerKey: 'poe',
      baseUrl: 'https://api.poe.com',
      apiKey: 'test-poe-key',
    });
    assert.equal(env.ANTHROPIC_AUTH_TOKEN, 'test-poe-key');
    assert.ok(!('ANTHROPIC_API_KEY' in env), 'ANTHROPIC_API_KEY should not be set');
    assert.equal(env.ANTHROPIC_BASE_URL, 'https://api.poe.com');
  });
});
