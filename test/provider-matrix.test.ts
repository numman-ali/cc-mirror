/**
 * Provider Feature Matrix Tests
 *
 * Verify each provider has expected features and flags.
 * Ensures consistency between provider templates and documentation.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { listProviders, getProvider, buildEnv, PROVIDER_DISPLAY_ORDER } from '../src/providers/index.js';

test('Provider Feature Matrix', async (t) => {
  const providers = listProviders(true); // Include experimental

  await t.test('all providers have required fields', () => {
    for (const provider of providers) {
      assert.ok(provider.key, `${provider.key} should have key`);
      assert.ok(provider.label, `${provider.key} should have label`);
      assert.ok(provider.description, `${provider.key} should have description`);
      assert.ok(typeof provider.baseUrl === 'string', `${provider.key} should have baseUrl (can be empty)`);
      assert.ok(provider.env, `${provider.key} should have env object`);
    }
  });

  await t.test('providers follow canonical display order', () => {
    assert.deepEqual(
      providers.map((provider) => provider.key),
      Array.from(PROVIDER_DISPLAY_ORDER),
      'providers should appear in canonical display order'
    );
  });

  await t.test('mirror provider has clean defaults', () => {
    const mirror = getProvider('mirror');
    assert.ok(mirror, 'mirror provider should exist');
    assert.ok(mirror.noPromptPack, 'mirror should have noPromptPack: true');
    assert.ok(mirror.credentialOptional, 'mirror should have credentialOptional: true');
    assert.equal(mirror.authMode, 'none', 'mirror should have authMode: none');
  });

  await t.test('ccrouter provider has correct auth mode', () => {
    const ccrouter = getProvider('ccrouter');
    assert.ok(ccrouter, 'ccrouter provider should exist');
    assert.equal(ccrouter.authMode, 'authToken', 'ccrouter should use authToken mode');
    assert.ok(ccrouter.credentialOptional, 'ccrouter should have credentialOptional: true');
  });

  await t.test('openrouter provider requires model mapping', () => {
    const openrouter = getProvider('openrouter');
    assert.ok(openrouter, 'openrouter provider should exist');
    assert.ok(openrouter.requiresModelMapping, 'openrouter should require model mapping');
    assert.equal(openrouter.authMode, 'authToken', 'openrouter should use authToken mode');
  });

  await t.test('ollama provider uses auth token + api key', () => {
    const ollama = getProvider('ollama');
    assert.ok(ollama, 'ollama provider should exist');
    assert.equal(ollama.authMode, 'authToken', 'ollama should use authToken mode');
    assert.ok(ollama.authTokenAlsoSetsApiKey, 'ollama should keep API key with auth token');
    assert.ok(ollama.requiresModelMapping, 'ollama should require model mapping');
    assert.ok(ollama.env.ANTHROPIC_AUTH_TOKEN, 'ollama should have default auth token');
    assert.ok(ollama.env.ANTHROPIC_API_KEY, 'ollama should have default api key');
  });

  await t.test('zai, minimax, and kimi providers have splash styles', () => {
    const zai = getProvider('zai');
    const minimax = getProvider('minimax');
    const kimi = getProvider('kimi');

    assert.ok(zai, 'zai provider should exist');
    assert.ok(minimax, 'minimax provider should exist');
    assert.ok(kimi, 'kimi provider should exist');

    assert.equal(zai.env.CC_MIRROR_SPLASH_STYLE, 'zai');
    assert.equal(minimax.env.CC_MIRROR_SPLASH_STYLE, 'minimax');
    assert.equal(kimi.env.CC_MIRROR_SPLASH_STYLE, 'kimi');
  });

  await t.test('experimental providers are hidden by default', () => {
    const visible = listProviders(false);
    const all = listProviders(true);

    assert.ok(all.length >= visible.length, 'Including experimental should have >= providers');

    const custom = getProvider('custom');
    assert.ok(custom, 'custom provider should exist');
    assert.ok(custom.experimental, 'custom should be experimental');

    const visibleKeys = visible.map((p) => p.key);
    assert.ok(!visibleKeys.includes('custom'), 'custom should not be in visible list');
  });

  await t.test('all non-experimental providers have CC_MIRROR env settings', () => {
    const visible = listProviders(false);
    for (const provider of visible) {
      assert.ok(provider.env.CC_MIRROR_SPLASH !== undefined, `${provider.key} should have CC_MIRROR_SPLASH`);
      assert.ok(provider.env.CC_MIRROR_PROVIDER_LABEL, `${provider.key} should have CC_MIRROR_PROVIDER_LABEL`);
      assert.ok(provider.env.CC_MIRROR_SPLASH_STYLE, `${provider.key} should have CC_MIRROR_SPLASH_STYLE`);
    }
  });

  await t.test('zai provider has default models', () => {
    const zai = getProvider('zai');
    assert.ok(zai, 'zai provider should exist');
    assert.equal(zai.env.ANTHROPIC_DEFAULT_HAIKU_MODEL, 'glm-4.5-air', 'zai should default haiku to glm-4.5-air');
    assert.equal(zai.env.ANTHROPIC_DEFAULT_SONNET_MODEL, 'glm-4.7', 'zai should default sonnet to glm-4.7');
    assert.equal(zai.env.ANTHROPIC_DEFAULT_OPUS_MODEL, 'glm-5', 'zai should default opus to glm-5');
  });

  await t.test('kimi provider has default models', () => {
    const kimi = getProvider('kimi');
    assert.ok(kimi, 'kimi provider should exist');
    assert.ok(kimi.env.ANTHROPIC_DEFAULT_HAIKU_MODEL, 'kimi should have haiku model');
    assert.ok(kimi.env.ANTHROPIC_DEFAULT_SONNET_MODEL, 'kimi should have sonnet model');
    assert.ok(kimi.env.ANTHROPIC_DEFAULT_OPUS_MODEL, 'kimi should have opus model');
  });

  await t.test('minimax provider has model settings', () => {
    const minimax = getProvider('minimax');
    assert.ok(minimax, 'minimax provider should exist');
    assert.ok(minimax.env.ANTHROPIC_MODEL, 'minimax should have ANTHROPIC_MODEL');
    assert.ok(minimax.env.ANTHROPIC_SMALL_FAST_MODEL, 'minimax should have ANTHROPIC_SMALL_FAST_MODEL');
  });

  await t.test('buildEnv derives startup/default models from alias mapping', () => {
    const zaiEnv = buildEnv({ providerKey: 'zai', apiKey: 'test-key' });
    assert.equal(
      zaiEnv.ANTHROPIC_MODEL,
      zaiEnv.ANTHROPIC_DEFAULT_OPUS_MODEL,
      'ANTHROPIC_MODEL should follow the Opus alias by default'
    );
    assert.equal(
      zaiEnv.ANTHROPIC_SMALL_FAST_MODEL,
      zaiEnv.ANTHROPIC_DEFAULT_HAIKU_MODEL,
      'ANTHROPIC_SMALL_FAST_MODEL should follow the Haiku alias by default'
    );
  });

  await t.test('buildEnv preserves explicit default/small-fast model overrides', () => {
    const env = buildEnv({
      providerKey: 'zai',
      apiKey: 'test-key',
      modelOverrides: {
        opus: 'glm-5',
        haiku: 'glm-4.5-air',
        defaultModel: 'glm-4.7',
        smallFast: 'glm-5-air',
      },
    });

    assert.equal(env.ANTHROPIC_MODEL, 'glm-4.7', 'explicit default model override should be preserved');
    assert.equal(env.ANTHROPIC_SMALL_FAST_MODEL, 'glm-5-air', 'explicit small-fast override should be preserved');
  });
});
