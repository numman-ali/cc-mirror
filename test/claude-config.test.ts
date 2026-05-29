import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  ensureClaudeConfigUiSuppressions,
  ensureMinimaxAuthTokenSettings,
  ensureOnboardingState,
  ensureSettingsModelMigration,
  syncSettingsManagedDefaults,
  ensureZaiAuthTokenSettings,
} from '../src/core/claude-config.js';

const makeTempDir = () => fs.mkdtempSync(path.join(os.tmpdir(), 'cc-mirror-claude-config-'));

test('ensureOnboardingState writes dark theme + onboarding flag', () => {
  const tempDir = makeTempDir();
  fs.mkdirSync(tempDir, { recursive: true });

  const result = ensureOnboardingState(tempDir, { themeId: 'dark' });
  assert.equal(result.updated, true);
  assert.equal(result.themeChanged, true);
  assert.equal(result.onboardingChanged, true);

  const configPath = path.join(tempDir, '.claude.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8')) as {
    theme?: string;
    hasCompletedOnboarding?: boolean;
  };
  assert.equal(config.theme, 'dark');
  assert.equal(config.hasCompletedOnboarding, true);

  const second = ensureOnboardingState(tempDir, { themeId: 'dark' });
  assert.equal(second.updated, false);
});

test('ensureSettingsModelMigration replaces stale model ids only', () => {
  const tempDir = makeTempDir();
  fs.mkdirSync(tempDir, { recursive: true });
  const settingsPath = path.join(tempDir, 'settings.json');
  fs.writeFileSync(
    settingsPath,
    JSON.stringify(
      {
        env: {
          ANTHROPIC_DEFAULT_OPUS_MODEL: 'pony-alpha-2',
          ANTHROPIC_DEFAULT_SONNET_MODEL: 'custom-sonnet',
          ANTHROPIC_DEFAULT_HAIKU_MODEL: 'pony-alpha-2',
          ANTHROPIC_MODEL: 'pony-alpha-2',
          ANTHROPIC_SMALL_FAST_MODEL: 'custom-fast',
        },
      },
      null,
      2
    )
  );

  const updated = ensureSettingsModelMigration(tempDir, {
    staleModels: ['pony-alpha-2'],
    replacements: {
      opus: 'glm-5.1',
      sonnet: 'glm-5-turbo',
      haiku: 'glm-4.5-air',
    },
  });

  assert.equal(updated, true);
  const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8')) as { env: Record<string, string> };
  assert.equal(settings.env.ANTHROPIC_DEFAULT_OPUS_MODEL, 'glm-5.1');
  assert.equal(settings.env.ANTHROPIC_DEFAULT_SONNET_MODEL, 'custom-sonnet');
  assert.equal(settings.env.ANTHROPIC_DEFAULT_HAIKU_MODEL, 'glm-4.5-air');
  assert.equal(settings.env.ANTHROPIC_MODEL, undefined);
  assert.equal(settings.env.ANTHROPIC_SMALL_FAST_MODEL, 'custom-fast');
});

test('syncSettingsManagedDefaults overwrites managed UI defaults', () => {
  const tempDir = makeTempDir();
  fs.mkdirSync(tempDir, { recursive: true });
  const settingsPath = path.join(tempDir, 'settings.json');
  fs.writeFileSync(
    settingsPath,
    JSON.stringify(
      {
        env: { CUSTOM_ENV: 'keep' },
        companyAnnouncements: ['old announcement'],
        spinnerTipsEnabled: true,
        availableModels: ['old-model'],
      },
      null,
      2
    )
  );

  const updated = syncSettingsManagedDefaults(tempDir, {
    companyAnnouncements: [],
    spinnerTipsEnabled: false,
    feedbackSurveyRate: 0,
    availableModels: ['provider-model'],
  });

  assert.equal(updated, true);
  const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8')) as {
    env: Record<string, string>;
    companyAnnouncements?: string[];
    spinnerTipsEnabled?: boolean;
    feedbackSurveyRate?: number;
    availableModels?: string[];
  };
  assert.equal(settings.env.CUSTOM_ENV, 'keep');
  assert.deepEqual(settings.companyAnnouncements, []);
  assert.equal(settings.spinnerTipsEnabled, false);
  assert.equal(settings.feedbackSurveyRate, 0);
  assert.deepEqual(settings.availableModels, ['provider-model']);
});

test('ensureClaudeConfigUiSuppressions marks upstream promos as seen', () => {
  const tempDir = makeTempDir();
  fs.mkdirSync(tempDir, { recursive: true });
  const configPath = path.join(tempDir, '.claude.json');
  fs.writeFileSync(configPath, JSON.stringify({ opus48LaunchSeenCount: 1 }, null, 2));

  const updated = ensureClaudeConfigUiSuppressions(tempDir);

  assert.equal(updated, true);
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8')) as {
    opus48LaunchSeenCount?: number;
    passesUpsellSeenCount?: number;
    desktopUpsellDismissed?: boolean;
    unpinOpus48LaunchEffort?: boolean;
  };
  assert.equal(config.opus48LaunchSeenCount, 999);
  assert.equal(config.passesUpsellSeenCount, 999);
  assert.equal(config.desktopUpsellDismissed, true);
  assert.equal(config.unpinOpus48LaunchEffort, true);
});

test('ensureZaiAuthTokenSettings migrates legacy API-key settings', () => {
  const tempDir = makeTempDir();
  fs.mkdirSync(tempDir, { recursive: true });
  const settingsPath = path.join(tempDir, 'settings.json');
  fs.writeFileSync(
    settingsPath,
    JSON.stringify(
      { env: { ANTHROPIC_API_KEY: 'zai-key', ANTHROPIC_BASE_URL: 'https://api.z.ai/api/anthropic' } },
      null,
      2
    )
  );

  const updated = ensureZaiAuthTokenSettings(tempDir);

  assert.equal(updated, true);
  const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8')) as { env: Record<string, string> };
  assert.equal(settings.env.ANTHROPIC_AUTH_TOKEN, 'zai-key');
  assert.equal(settings.env.Z_AI_API_KEY, 'zai-key');
  assert.equal(settings.env.ANTHROPIC_API_KEY, '');
});

test('ensureMinimaxAuthTokenSettings migrates legacy API-key settings', () => {
  const tempDir = makeTempDir();
  fs.mkdirSync(tempDir, { recursive: true });
  const settingsPath = path.join(tempDir, 'settings.json');
  fs.writeFileSync(
    settingsPath,
    JSON.stringify(
      { env: { ANTHROPIC_API_KEY: 'minimax-key', ANTHROPIC_BASE_URL: 'https://api.minimax.io/anthropic' } },
      null,
      2
    )
  );

  const updated = ensureMinimaxAuthTokenSettings(tempDir);

  assert.equal(updated, true);
  const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8')) as { env: Record<string, string> };
  assert.equal(settings.env.ANTHROPIC_AUTH_TOKEN, 'minimax-key');
  assert.equal(settings.env.ANTHROPIC_API_KEY, '');
});
