import test from 'node:test';
import assert from 'node:assert/strict';
import {
  describePromptPack,
  getTuiProviderCapabilities,
  resolveCredentialDefaults,
  shouldPromptForCredential,
  shouldShowModelSetup,
} from '../../src/tui/providerCapabilities.js';

test('TUI provider capabilities preserve Zai defaults', () => {
  const capabilities = getTuiProviderCapabilities('zai');

  assert.equal(capabilities.credential.envVar, 'ANTHROPIC_AUTH_TOKEN');
  assert.deepEqual(capabilities.credential.detectEnvVars, [
    'Z_AI_API_KEY',
    'ANTHROPIC_AUTH_TOKEN',
    'ANTHROPIC_API_KEY',
  ]);
  assert.equal(capabilities.promptPack.defaultEnabled, true);
  assert.equal(describePromptPack(true, capabilities), 'on (zai-cli routing)');
  assert.equal(capabilities.shellEnv.configurable, true);
  assert.equal(shouldShowModelSetup(capabilities), false);
});

test('TUI provider capabilities preserve gateway model requirements', () => {
  const capabilities = getTuiProviderCapabilities('openrouter', {
    key: 'openrouter',
    label: 'OpenRouter',
    description: 'Gateway',
    baseUrl: 'https://openrouter.ai/api',
    env: {},
    apiKeyLabel: 'OpenRouter API key',
    authMode: 'authToken',
    requiresModelMapping: true,
  });

  assert.equal(capabilities.credential.required, true);
  assert.equal(capabilities.credential.envVar, 'ANTHROPIC_AUTH_TOKEN');
  assert.equal(capabilities.models.required, true);
  assert.equal(capabilities.models.showInSetup, true);
  assert.equal(capabilities.models.prefillDefaults, false);
  assert.equal(capabilities.models.guidance, 'openrouter');
});

test('TUI provider capabilities preserve optional router credential flow', () => {
  const capabilities = getTuiProviderCapabilities('ccrouter', {
    key: 'ccrouter',
    label: 'CC Router',
    description: 'Local router',
    baseUrl: 'http://127.0.0.1:3456',
    env: {},
    apiKeyLabel: 'Router URL',
    authMode: 'authToken',
    credentialOptional: true,
  });

  assert.equal(capabilities.endpoint.kind, 'router-url');
  assert.equal(capabilities.endpoint.required, true);
  assert.equal(capabilities.credential.required, false);
  assert.equal(shouldPromptForCredential(capabilities), false);
});

test('TUI provider capabilities can consume a future contract shape', () => {
  const capabilities = getTuiProviderCapabilities('future', {
    key: 'future',
    label: 'Future',
    description: 'Future provider',
    baseUrl: 'https://future.example',
    env: {},
    apiKeyLabel: 'Future token',
    capabilities: {
      credential: {
        envVar: 'ANTHROPIC_AUTH_TOKEN',
        detectEnvVars: ['FUTURE_TOKEN'],
        skipPromptWhenDetectedFrom: ['FUTURE_TOKEN'],
      },
      models: {
        required: true,
        showInSetup: true,
        prefillDefaults: true,
        defaults: { opus: 'future-opus', sonnet: 'future-sonnet', haiku: 'future-haiku' },
      },
      promptPack: { defaultEnabled: true, routingLabel: 'future tools' },
      shellEnv: { defaultEnabled: true, configurable: true, envVar: 'FUTURE_TOKEN' },
    },
  });

  const detected = resolveCredentialDefaults(capabilities, { FUTURE_TOKEN: 'token' });

  assert.equal(detected.value, 'token');
  assert.equal(detected.skipPrompt, true);
  assert.equal(capabilities.models.defaults.opus, 'future-opus');
  assert.equal(describePromptPack(true, capabilities), 'on (future tools)');
});
