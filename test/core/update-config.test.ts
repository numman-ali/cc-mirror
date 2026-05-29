import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ConfigUpdateStep } from '../../src/core/variant-builder/update-steps/ConfigUpdateStep.js';
import type { UpdateContext } from '../../src/core/variant-builder/types.js';
import { cleanup, makeTempDir } from '../helpers/index.js';

type UpdatedSettings = {
  env: Record<string, string | undefined>;
  model?: string;
  availableModels?: string[];
  companyAnnouncements?: string[];
  spinnerTipsEnabled?: boolean;
  feedbackSurveyRate?: number;
  attribution?: {
    commit: string;
    pr: string;
  };
};

const makeContext = (rootDir: string, provider: string, notes: string[]): UpdateContext => {
  const variantDir = path.join(rootDir, provider);
  const configDir = path.join(variantDir, 'config');
  const tweakDir = path.join(variantDir, 'tweakcc');
  const nativeDir = path.join(variantDir, 'native');
  fs.mkdirSync(configDir, { recursive: true });
  fs.mkdirSync(tweakDir, { recursive: true });
  fs.mkdirSync(nativeDir, { recursive: true });

  return {
    name: provider,
    opts: { noTweak: true },
    meta: {
      name: provider,
      provider,
      createdAt: new Date().toISOString(),
      claudeOrig: 'native:0.0.0',
      binaryPath: path.join(nativeDir, 'claude'),
      configDir,
      tweakDir,
    },
    paths: {
      resolvedRoot: rootDir,
      resolvedBin: undefined,
      variantDir,
      nativeDir,
    },
    prefs: {
      resolvedClaudeVersion: 'stable',
      promptPackPreference: false,
      promptPackEnabled: false,
      skillInstallEnabled: false,
      shellEnvEnabled: false,
      skillUpdateEnabled: false,
      commandStdio: 'pipe',
    },
    state: {
      notes,
      tweakResult: null,
      brandKey: null,
    },
    report: () => {},
    isAsync: false,
  };
};

test('ConfigUpdateStep migrates stale Z.ai model and auth settings', () => {
  const rootDir = makeTempDir();
  try {
    const notes: string[] = [];
    const ctx = makeContext(rootDir, 'zai', notes);
    const settingsPath = path.join(ctx.meta.configDir, 'settings.json');
    fs.writeFileSync(
      settingsPath,
      JSON.stringify(
        {
          env: {
            ANTHROPIC_API_KEY: 'zai-key',
            ANTHROPIC_BASE_URL: 'https://api.z.ai/api/anthropic',
            ANTHROPIC_DEFAULT_OPUS_MODEL: 'pony-alpha-2',
            ANTHROPIC_DEFAULT_SONNET_MODEL: 'pony-alpha-2',
            ANTHROPIC_DEFAULT_HAIKU_MODEL: 'pony-alpha-2',
            ANTHROPIC_MODEL: 'pony-alpha-2',
            ANTHROPIC_SMALL_FAST_MODEL: 'pony-alpha-2',
          },
        },
        null,
        2
      )
    );

    new ConfigUpdateStep().execute(ctx);

    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8')) as UpdatedSettings;
    assert.equal(settings.env.ANTHROPIC_AUTH_TOKEN, 'zai-key');
    assert.equal(settings.env.Z_AI_API_KEY, 'zai-key');
    assert.equal(settings.env.ANTHROPIC_API_KEY, '');
    assert.equal(settings.env.ANTHROPIC_DEFAULT_OPUS_MODEL, 'glm-5.1');
    assert.equal(settings.env.ANTHROPIC_DEFAULT_SONNET_MODEL, 'glm-5-turbo');
    assert.equal(settings.env.ANTHROPIC_DEFAULT_HAIKU_MODEL, 'glm-4.5-air');
    assert.equal(settings.env.ANTHROPIC_MODEL, undefined);
    assert.equal(settings.env.ANTHROPIC_SMALL_FAST_MODEL, 'glm-4.5-air');
    assert.equal(settings.env.ANTHROPIC_DEFAULT_OPUS_MODEL_NAME, 'GLM-5.1');
    assert.equal(settings.env.ANTHROPIC_CUSTOM_MODEL_OPTION_NAME, 'GLM-5.1');
    assert.equal(settings.model, 'glm-5.1');
    assert.deepEqual(settings.companyAnnouncements, []);
    assert.equal(settings.spinnerTipsEnabled, false);
    assert.equal(settings.feedbackSurveyRate, 0);
    assert.deepEqual(settings.availableModels, ['glm-5.1', 'glm-5-turbo', 'glm-4.5-air']);
    assert.ok(notes.some((note) => note.includes('Refreshed managed runtime settings')));
  } finally {
    cleanup(rootDir);
  }
});

test('ConfigUpdateStep migrates stale MiniMax model and auth settings', () => {
  const rootDir = makeTempDir();
  try {
    const notes: string[] = [];
    const ctx = makeContext(rootDir, 'minimax', notes);
    const settingsPath = path.join(ctx.meta.configDir, 'settings.json');
    fs.writeFileSync(
      settingsPath,
      JSON.stringify(
        {
          env: {
            ANTHROPIC_API_KEY: 'minimax-key',
            ANTHROPIC_BASE_URL: 'https://api.minimax.io/anthropic',
            ANTHROPIC_DEFAULT_OPUS_MODEL: 'MiniMax-M2.5',
            ANTHROPIC_DEFAULT_SONNET_MODEL: 'MiniMax-M2.5',
            ANTHROPIC_DEFAULT_HAIKU_MODEL: 'MiniMax-M2.5',
            ANTHROPIC_MODEL: 'MiniMax-M2.5',
            ANTHROPIC_SMALL_FAST_MODEL: 'MiniMax-M2.5',
          },
        },
        null,
        2
      )
    );

    new ConfigUpdateStep().execute(ctx);

    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8')) as UpdatedSettings;
    assert.equal(settings.env.ANTHROPIC_AUTH_TOKEN, 'minimax-key');
    assert.equal(settings.env.ANTHROPIC_API_KEY, '');
    assert.equal(settings.env.ANTHROPIC_DEFAULT_OPUS_MODEL, 'MiniMax-M2.7');
    assert.equal(settings.env.ANTHROPIC_DEFAULT_SONNET_MODEL, 'MiniMax-M2.7');
    assert.equal(settings.env.ANTHROPIC_DEFAULT_HAIKU_MODEL, 'MiniMax-M2.7');
    assert.equal(settings.env.ANTHROPIC_MODEL, 'MiniMax-M2.7');
    assert.equal(settings.env.ANTHROPIC_SMALL_FAST_MODEL, 'MiniMax-M2.7');
    assert.equal(settings.env.ANTHROPIC_DEFAULT_SONNET_MODEL_NAME, 'MiniMax-M2.7');
    assert.equal(settings.model, 'MiniMax-M2.7');
    assert.deepEqual(settings.availableModels, ['MiniMax-M2.7']);
    assert.ok(notes.some((note) => note.includes('Refreshed managed runtime settings')));
  } finally {
    cleanup(rootDir);
  }
});

test('ConfigUpdateStep preserves credentials and custom env while adding managed runtime defaults', () => {
  const rootDir = makeTempDir();
  try {
    const notes: string[] = [];
    const ctx = makeContext(rootDir, 'zai', notes);
    const settingsPath = path.join(ctx.meta.configDir, 'settings.json');
    fs.writeFileSync(
      settingsPath,
      JSON.stringify(
        {
          env: {
            ANTHROPIC_AUTH_TOKEN: 'keep-zai-token',
            Z_AI_API_KEY: 'keep-zai-token',
            CUSTOM_ENV: 'keep-user-value',
          },
        },
        null,
        2
      )
    );

    new ConfigUpdateStep().execute(ctx);

    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8')) as UpdatedSettings;
    assert.equal(settings.env.ANTHROPIC_AUTH_TOKEN, 'keep-zai-token');
    assert.equal(settings.env.Z_AI_API_KEY, 'keep-zai-token');
    assert.equal(settings.env.ANTHROPIC_API_KEY, '');
    assert.equal(settings.env.CUSTOM_ENV, 'keep-user-value');
    assert.equal(settings.env.ANTHROPIC_BASE_URL, 'https://api.z.ai/api/anthropic');
    assert.equal(settings.env.DISABLE_UPDATES, '1');
    assert.equal(settings.env.DISABLE_AUTOUPDATER, '1');
    assert.equal(settings.env.DISABLE_TELEMETRY, '1');
    assert.equal(settings.env.DISABLE_ERROR_REPORTING, '1');
    assert.equal(settings.env.DISABLE_GROWTHBOOK, '1');
    assert.equal(settings.env.ENABLE_TOOL_SEARCH, 'false');
    assert.equal(settings.env.CLAUDE_CODE_ENABLE_GATEWAY_MODEL_DISCOVERY, '0');
    assert.equal(settings.env.DISABLE_INSTALLATION_CHECKS, '1');
    assert.equal(settings.env.CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC, '1');
    assert.equal(settings.env.ANTHROPIC_DEFAULT_OPUS_MODEL, 'glm-5.1');
    assert.equal(settings.env.ANTHROPIC_DEFAULT_SONNET_MODEL, 'glm-5-turbo');
    assert.equal(settings.env.ANTHROPIC_DEFAULT_HAIKU_MODEL, 'glm-4.5-air');
    assert.equal(settings.env.ANTHROPIC_SMALL_FAST_MODEL, 'glm-4.5-air');
    assert.equal(settings.model, 'glm-5.1');
    assert.deepEqual(settings.attribution, { commit: '', pr: '' });
    assert.ok(
      notes.some((note) => note.includes('Refreshed managed runtime settings')),
      'update should report managed runtime default refresh'
    );
  } finally {
    cleanup(rootDir);
  }
});

test('ConfigUpdateStep can rotate credentials during update', () => {
  const rootDir = makeTempDir();
  try {
    const notes: string[] = [];
    const ctx = makeContext(rootDir, 'kimi', notes);
    ctx.opts = { ...ctx.opts, apiKey: 'new-kimi-key' };
    const settingsPath = path.join(ctx.meta.configDir, 'settings.json');
    fs.writeFileSync(
      settingsPath,
      JSON.stringify(
        {
          env: {
            ANTHROPIC_AUTH_TOKEN: 'old-kimi-key',
            ANTHROPIC_API_KEY: '',
            CUSTOM_ENV: 'keep-user-value',
          },
        },
        null,
        2
      )
    );

    new ConfigUpdateStep().execute(ctx);

    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8')) as UpdatedSettings;
    assert.equal(settings.env.ANTHROPIC_AUTH_TOKEN, 'new-kimi-key');
    assert.equal(settings.env.ANTHROPIC_API_KEY, '');
    assert.equal(settings.env.CUSTOM_ENV, 'keep-user-value');
    assert.equal(settings.env.ANTHROPIC_MODEL, 'kimi-k2.6');
  } finally {
    cleanup(rootDir);
  }
});

test('ConfigUpdateStep moves Kimi to K2.6 Moonshot defaults while preserving the credential', () => {
  const rootDir = makeTempDir();
  try {
    const notes: string[] = [];
    const ctx = makeContext(rootDir, 'kimi', notes);
    ctx.meta.baseUrl = 'https://api.kimi.com/coding/';
    const settingsPath = path.join(ctx.meta.configDir, 'settings.json');
    fs.writeFileSync(
      settingsPath,
      JSON.stringify(
        {
          env: {
            ANTHROPIC_API_KEY: 'kimi-key',
            ANTHROPIC_BASE_URL: 'https://api.kimi.com/coding/',
            ANTHROPIC_DEFAULT_OPUS_MODEL: 'kimi-for-coding',
            ANTHROPIC_DEFAULT_SONNET_MODEL: 'kimi-for-coding',
            ANTHROPIC_DEFAULT_HAIKU_MODEL: 'kimi-for-coding',
            ANTHROPIC_MODEL: 'kimi-for-coding',
            CC_MIRROR_UNSET_AUTH_TOKEN: '1',
            CUSTOM_ENV: 'keep-user-value',
          },
        },
        null,
        2
      )
    );

    new ConfigUpdateStep().execute(ctx);

    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8')) as UpdatedSettings;
    assert.equal(ctx.meta.baseUrl, 'https://api.moonshot.ai/anthropic');
    assert.equal(settings.env.ANTHROPIC_AUTH_TOKEN, 'kimi-key');
    assert.equal(settings.env.ANTHROPIC_API_KEY, '');
    assert.equal(settings.env.ANTHROPIC_BASE_URL, 'https://api.moonshot.ai/anthropic');
    assert.equal(settings.env.ANTHROPIC_DEFAULT_OPUS_MODEL, 'kimi-k2.6');
    assert.equal(settings.env.ANTHROPIC_DEFAULT_SONNET_MODEL, 'kimi-k2.6');
    assert.equal(settings.env.ANTHROPIC_DEFAULT_HAIKU_MODEL, 'kimi-k2.6');
    assert.equal(settings.env.ANTHROPIC_MODEL, 'kimi-k2.6');
    assert.equal(settings.env.CC_MIRROR_UNSET_AUTH_TOKEN, undefined);
    assert.equal(settings.env.CLAUDE_CODE_SUBAGENT_MODEL, 'kimi-k2.6');
    assert.equal(settings.env.ANTHROPIC_DEFAULT_SONNET_MODEL_NAME, 'Kimi K2.6');
    assert.equal(settings.env.ANTHROPIC_CUSTOM_MODEL_OPTION, 'kimi-k2.6');
    assert.equal(settings.env.CUSTOM_ENV, 'keep-user-value');
    assert.equal(settings.model, 'kimi-k2.6');
    assert.deepEqual(settings.availableModels, ['kimi-k2.6']);
    const claudeConfig = JSON.parse(fs.readFileSync(path.join(ctx.meta.configDir, '.claude.json'), 'utf8')) as {
      opus48LaunchSeenCount?: number;
      passesUpsellSeenCount?: number;
    };
    assert.equal(claudeConfig.opus48LaunchSeenCount, 999);
    assert.equal(claudeConfig.passesUpsellSeenCount, 999);
    assert.ok(notes.some((note) => note.includes('Refreshed managed runtime settings')));
  } finally {
    cleanup(rootDir);
  }
});

test('ConfigUpdateStep overwrites stale managed defaults while preserving custom env', () => {
  const rootDir = makeTempDir();
  try {
    const notes: string[] = [];
    const ctx = makeContext(rootDir, 'nanogpt', notes);
    ctx.meta.baseUrl = 'https://nano-gpt.com/api';
    const settingsPath = path.join(ctx.meta.configDir, 'settings.json');
    fs.writeFileSync(
      settingsPath,
      JSON.stringify(
        {
          env: {
            ANTHROPIC_AUTH_TOKEN: 'nanogpt-key',
            ANTHROPIC_API_KEY: '',
            ANTHROPIC_BASE_URL: 'https://nano-gpt.com/api',
            ANTHROPIC_DEFAULT_OPUS_MODEL: 'moonshotai/kimi-k2.5',
            ANTHROPIC_DEFAULT_SONNET_MODEL: 'moonshotai/kimi-k2.5',
            ANTHROPIC_DEFAULT_HAIKU_MODEL: 'moonshotai/kimi-k2.5',
            DISABLE_UPDATES: '0',
            CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: '0',
            CUSTOM_ENV: 'keep-user-value',
          },
        },
        null,
        2
      )
    );

    new ConfigUpdateStep().execute(ctx);

    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8')) as UpdatedSettings;
    assert.equal(settings.env.ANTHROPIC_AUTH_TOKEN, 'nanogpt-key');
    assert.equal(settings.env.ANTHROPIC_BASE_URL, 'https://nano-gpt.com/api/v1');
    assert.equal(settings.env.ANTHROPIC_DEFAULT_OPUS_MODEL, 'openai/gpt-5.2');
    assert.equal(settings.env.ANTHROPIC_DEFAULT_SONNET_MODEL, 'openai/gpt-5.2');
    assert.equal(settings.env.ANTHROPIC_DEFAULT_HAIKU_MODEL, 'google/gemini-3-flash-preview');
    assert.equal(settings.env.DISABLE_UPDATES, '1');
    assert.equal(settings.env.CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC, '1');
    assert.equal(settings.env.API_TIMEOUT_MS, '600000');
    assert.equal(settings.env.CUSTOM_ENV, 'keep-user-value');
  } finally {
    cleanup(rootDir);
  }
});
