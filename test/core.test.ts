import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import * as core from '../src/core/index.js';
import { makeTempDir, readFile, cleanup, withFakeNpm, resolveNpmCliPath } from './helpers/index.js';

test('core create/update/remove/doctor flows', () => {
  withFakeNpm(() => {
    process.env.CC_MIRROR_FAKE_NPM_PAYLOAD = 'claude dummy';
    const rootDir = makeTempDir();
    const binDir = makeTempDir();

    const result = core.createVariant({
      name: 'alpha',
      providerKey: 'custom',
      baseUrl: 'http://localhost:4000/anthropic',
      apiKey: '',
      extraEnv: ['FOO=bar'],
      rootDir,
      binDir,
      noTweak: true,
      tweakccStdio: 'pipe',
    });

    const variantDir = path.join(rootDir, 'alpha');
    const npmDir = path.join(variantDir, 'npm');
    const binaryPath = resolveNpmCliPath(npmDir, core.DEFAULT_NPM_PACKAGE);
    const configPath = path.join(variantDir, 'config', 'settings.json');
    const wrapperPath = path.join(binDir, 'alpha');
    const variantMetaPath = path.join(variantDir, 'variant.json');

    assert.ok(fs.existsSync(binaryPath));
    assert.ok(fs.existsSync(configPath));
    assert.ok(fs.existsSync(wrapperPath));
    assert.ok(fs.existsSync(variantMetaPath));
    assert.equal(result.wrapperPath, wrapperPath);

    const configJson = JSON.parse(readFile(configPath)) as { env: Record<string, string> };
    assert.equal(configJson.env.ANTHROPIC_BASE_URL, 'http://localhost:4000/anthropic');
    assert.equal(configJson.env.FOO, 'bar');
    assert.equal(configJson.env.ANTHROPIC_API_KEY, '<API_KEY>');
    assert.equal(configJson.env.DISABLE_AUTOUPDATER, '1');
    assert.equal(configJson.env.CLAUDE_CODE_ENABLE_PROMPT_SUGGESTION, '1');

    process.env.CC_MIRROR_FAKE_NPM_PAYLOAD = 'claude new';
    core.updateVariant(rootDir, 'alpha', { noTweak: true, tweakccStdio: 'pipe' });
    assert.equal(readFile(binaryPath).includes('claude new'), true);

    const doctorReport = core.doctor(rootDir, binDir);
    assert.equal(doctorReport.length, 1);
    assert.equal(doctorReport[0].ok, true);

    core.removeVariant(rootDir, 'alpha');
    assert.equal(fs.existsSync(variantDir), false);

    cleanup(rootDir);
    cleanup(binDir);
  });
});

test('zai brand preset writes tweakcc config', () => {
  withFakeNpm(() => {
    const rootDir = makeTempDir();
    const binDir = makeTempDir();

    core.createVariant({
      name: 'zai',
      providerKey: 'zai',
      apiKey: '',
      rootDir,
      binDir,
      brand: 'zai',
      promptPack: false,
      skillInstall: false,
      noTweak: true,
      tweakccStdio: 'pipe',
    });

    const tweakConfigPath = path.join(rootDir, 'zai', 'tweakcc', 'config.json');
    assert.ok(fs.existsSync(tweakConfigPath));
    const tweakConfig = JSON.parse(readFile(tweakConfigPath)) as { settings?: { themes?: { id?: string }[] } };
    assert.equal(tweakConfig.settings?.themes?.[0]?.id, 'zai-carbon');

    cleanup(rootDir);
    cleanup(binDir);
  });
});

test('minimax brand preset writes tweakcc config', () => {
  withFakeNpm(() => {
    const rootDir = makeTempDir();
    const binDir = makeTempDir();

    core.createVariant({
      name: 'minimax',
      providerKey: 'minimax',
      apiKey: '',
      rootDir,
      binDir,
      brand: 'minimax',
      promptPack: false,
      skillInstall: false,
      noTweak: true,
      tweakccStdio: 'pipe',
    });

    const tweakConfigPath = path.join(rootDir, 'minimax', 'tweakcc', 'config.json');
    assert.ok(fs.existsSync(tweakConfigPath));
    const tweakConfig = JSON.parse(readFile(tweakConfigPath)) as { settings?: { themes?: { id?: string }[] } };
    const themeIds = tweakConfig.settings?.themes?.map((theme) => theme?.id) ?? [];
    assert.equal(themeIds[0], 'minimax-pulse');
    assert.equal(themeIds.includes('minimax-glass'), false);
    assert.equal(themeIds.includes('minimax-blade'), false);
    assert.equal(themeIds.includes('minimax-ember'), false);

    const claudeConfigPath = path.join(rootDir, 'minimax', 'config', '.claude.json');
    assert.ok(fs.existsSync(claudeConfigPath));
    const claudeConfig = JSON.parse(readFile(claudeConfigPath)) as {
      mcpServers?: Record<string, { command?: string; args?: string[]; env?: Record<string, string> }>;
    };
    const minimaxServer = claudeConfig.mcpServers?.MiniMax;
    assert.ok(minimaxServer);
    assert.equal(minimaxServer?.command, 'uvx');
    assert.deepEqual(minimaxServer?.args, ['minimax-coding-plan-mcp', '-y']);

    cleanup(rootDir);
    cleanup(binDir);
  });
});

test('openrouter brand preset writes tweakcc config', () => {
  withFakeNpm(() => {
    const rootDir = makeTempDir();
    const binDir = makeTempDir();

    core.createVariant({
      name: 'openrouter',
      providerKey: 'openrouter',
      apiKey: 'or-key',
      rootDir,
      binDir,
      brand: 'openrouter',
      promptPack: false,
      skillInstall: false,
      noTweak: true,
      tweakccStdio: 'pipe',
    });

    const tweakConfigPath = path.join(rootDir, 'openrouter', 'tweakcc', 'config.json');
    assert.ok(fs.existsSync(tweakConfigPath));
    const tweakConfig = JSON.parse(readFile(tweakConfigPath)) as { settings?: { themes?: { id?: string }[] } };
    assert.equal(tweakConfig.settings?.themes?.[0]?.id, 'openrouter-teal');

    cleanup(rootDir);
    cleanup(binDir);
  });
});

test('ccrouter brand preset writes tweakcc config', () => {
  withFakeNpm(() => {
    const rootDir = makeTempDir();
    const binDir = makeTempDir();

    core.createVariant({
      name: 'ccrouter',
      providerKey: 'ccrouter',
      apiKey: '',
      rootDir,
      binDir,
      brand: 'ccrouter',
      promptPack: false,
      skillInstall: false,
      noTweak: true,
      tweakccStdio: 'pipe',
    });

    const tweakConfigPath = path.join(rootDir, 'ccrouter', 'tweakcc', 'config.json');
    assert.ok(fs.existsSync(tweakConfigPath));
    const tweakConfig = JSON.parse(readFile(tweakConfigPath)) as { settings?: { themes?: { id?: string }[] } };
    assert.equal(tweakConfig.settings?.themes?.[0]?.id, 'ccrouter-sky');

    cleanup(rootDir);
    cleanup(binDir);
  });
});

test('mirror brand preset writes tweakcc config and enables team mode', () => {
  withFakeNpm(() => {
    const rootDir = makeTempDir();
    const binDir = makeTempDir();

    core.createVariant({
      name: 'mirror-test',
      providerKey: 'mirror',
      apiKey: '',
      rootDir,
      binDir,
      brand: 'mirror',
      noTweak: true,
      tweakccStdio: 'pipe',
    });

    // Verify tweakcc config with mirror theme
    const tweakConfigPath = path.join(rootDir, 'mirror-test', 'tweakcc', 'config.json');
    assert.ok(fs.existsSync(tweakConfigPath));
    const tweakConfig = JSON.parse(readFile(tweakConfigPath)) as { settings?: { themes?: { id?: string }[] } };
    assert.equal(tweakConfig.settings?.themes?.[0]?.id, 'mirror-claude');

    // Verify variant.json has team mode enabled (mirror provider auto-enables)
    const variantPath = path.join(rootDir, 'mirror-test', 'variant.json');
    const variant = JSON.parse(readFile(variantPath)) as { teamModeEnabled?: boolean; promptPack?: boolean };
    assert.equal(variant.teamModeEnabled, true, 'mirror provider should auto-enable team mode');
    assert.equal(variant.promptPack, false, 'mirror provider should have promptPack disabled');

    // Verify settings.json has no auth overrides (pure Claude Code)
    const settingsPath = path.join(rootDir, 'mirror-test', 'config', 'settings.json');
    const settings = JSON.parse(readFile(settingsPath)) as { env?: Record<string, unknown> };
    assert.ok(!settings.env?.ANTHROPIC_BASE_URL, 'mirror should not set ANTHROPIC_BASE_URL');
    assert.ok(!settings.env?.ANTHROPIC_API_KEY, 'mirror should not set ANTHROPIC_API_KEY');
    assert.ok(settings.env?.CC_MIRROR_SPLASH, 'mirror should set splash env');

    cleanup(rootDir);
    cleanup(binDir);
  });
});

test('api key approvals are written to .claude.json', () => {
  withFakeNpm(() => {
    const rootDir = makeTempDir();
    const binDir = makeTempDir();

    const apiKey = 'sk-test-1234567890abcdefghijklmnopqrstuvwxyz';

    core.createVariant({
      name: 'beta',
      providerKey: 'custom',
      baseUrl: 'http://localhost:4000/anthropic',
      apiKey,
      rootDir,
      binDir,
      noTweak: true,
      tweakccStdio: 'pipe',
    });

    const claudeConfigPath = path.join(rootDir, 'beta', 'config', '.claude.json');
    assert.ok(fs.existsSync(claudeConfigPath));
    const config = JSON.parse(readFile(claudeConfigPath)) as {
      customApiKeyResponses?: { approved?: string[] };
    };
    const approved = config.customApiKeyResponses?.approved ?? [];
    assert.ok(approved.includes(apiKey.slice(-20)));

    cleanup(rootDir);
    cleanup(binDir);
  });
});

test('settingsOnly update preserves binary and only updates settings', () => {
  withFakeNpm(() => {
    process.env.CC_MIRROR_FAKE_NPM_PAYLOAD = 'claude original';
    const rootDir = makeTempDir();
    const binDir = makeTempDir();

    core.createVariant({
      name: 'gamma',
      providerKey: 'openrouter',
      apiKey: 'or-key',
      rootDir,
      binDir,
      noTweak: true,
      tweakccStdio: 'pipe',
    });

    const variantDir = path.join(rootDir, 'gamma');
    const npmDir = path.join(variantDir, 'npm');
    const binaryPath = resolveNpmCliPath(npmDir, core.DEFAULT_NPM_PACKAGE);

    // Verify original binary content
    assert.equal(readFile(binaryPath).includes('claude original'), true);

    // Update with a different fake npm payload
    process.env.CC_MIRROR_FAKE_NPM_PAYLOAD = 'claude updated';

    // Update with settingsOnly - should NOT reinstall npm package
    core.updateVariant(rootDir, 'gamma', {
      settingsOnly: true,
      noTweak: true,
      tweakccStdio: 'pipe',
      modelOverrides: {
        sonnet: 'anthropic/claude-sonnet',
        haiku: 'anthropic/claude-haiku',
      },
    });

    // Binary should still have original content (not reinstalled)
    assert.equal(readFile(binaryPath).includes('claude original'), true);
    assert.equal(readFile(binaryPath).includes('claude updated'), false);

    // But settings should be updated with model overrides
    const configPath = path.join(variantDir, 'config', 'settings.json');
    const configJson = JSON.parse(readFile(configPath)) as {
      env: Record<string, string>;
    };
    assert.equal(configJson.env.ANTHROPIC_DEFAULT_SONNET_MODEL, 'anthropic/claude-sonnet');
    assert.equal(configJson.env.ANTHROPIC_DEFAULT_HAIKU_MODEL, 'anthropic/claude-haiku');

    cleanup(rootDir);
    cleanup(binDir);
  });
});
