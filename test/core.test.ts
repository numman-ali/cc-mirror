import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import * as core from '../src/core/index.js';
import { getWrapperPath } from '../src/core/paths.js';
import { makeTempDir, readFile, cleanup, resolveNativeClaudePath } from './helpers/index.js';

test('core create/update/remove/doctor flows', async () => {
  const rootDir = makeTempDir();
  const binDir = makeTempDir();

  const result = await core.createVariantAsync({
    name: 'alpha',
    providerKey: 'custom',
    baseUrl: 'http://localhost:4000/anthropic',
    apiKey: '',
    extraEnv: ['FOO=bar'],
    claudeVersion: 'stable',
    rootDir,
    binDir,
    noTweak: true,
    tweakccStdio: 'pipe',
  });

  const variantDir = path.join(rootDir, 'alpha');
  const nativeDir = path.join(variantDir, 'native');
  const binaryPath = resolveNativeClaudePath(nativeDir);
  const configPath = path.join(variantDir, 'config', 'settings.json');
  const wrapperPath = getWrapperPath(binDir, 'alpha');
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
  assert.equal(configJson.env.DISABLE_AUTO_MIGRATE_TO_NATIVE, '1');
  assert.equal(configJson.env.DISABLE_INSTALLATION_CHECKS, '1');
  assert.equal(configJson.env.CLAUDE_CODE_ENABLE_PROMPT_SUGGESTION, '1');

  const metaBefore = JSON.parse(readFile(variantMetaPath)) as { updatedAt?: string };
  await new Promise((resolve) => setTimeout(resolve, 10));
  await core.updateVariantAsync(rootDir, 'alpha', { noTweak: true, tweakccStdio: 'pipe' });
  const metaAfter = JSON.parse(readFile(variantMetaPath)) as { updatedAt?: string };
  assert.ok(metaAfter.updatedAt, 'updatedAt should be set after update');
  assert.notEqual(metaAfter.updatedAt, metaBefore.updatedAt);

  const doctorReport = core.doctor(rootDir, binDir);
  assert.equal(doctorReport.length, 1);
  assert.equal(doctorReport[0].ok, true);

  core.removeVariant(rootDir, 'alpha');
  assert.equal(fs.existsSync(variantDir), false);

  cleanup(rootDir);
  cleanup(binDir);
});

test('zai brand preset writes tweakcc config', async () => {
  const rootDir = makeTempDir();
  const binDir = makeTempDir();

  try {
    await core.createVariantAsync({
      name: 'zai',
      providerKey: 'zai',
      apiKey: '',
      claudeVersion: 'stable',
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
  } finally {
    cleanup(rootDir);
    cleanup(binDir);
  }
});

test('minimax brand preset writes tweakcc config', async () => {
  const rootDir = makeTempDir();
  const binDir = makeTempDir();

  try {
    await core.createVariantAsync({
      name: 'minimax',
      providerKey: 'minimax',
      apiKey: '',
      claudeVersion: 'stable',
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
  } finally {
    cleanup(rootDir);
    cleanup(binDir);
  }
});

test('openrouter brand preset writes tweakcc config', async () => {
  const rootDir = makeTempDir();
  const binDir = makeTempDir();

  try {
    await core.createVariantAsync({
      name: 'openrouter',
      providerKey: 'openrouter',
      apiKey: 'or-key',
      claudeVersion: 'stable',
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
    assert.equal(tweakConfig.settings?.themes?.[0]?.id, 'openrouter-navy');
  } finally {
    cleanup(rootDir);
    cleanup(binDir);
  }
});

test('ccrouter brand preset writes tweakcc config', async () => {
  const rootDir = makeTempDir();
  const binDir = makeTempDir();

  try {
    await core.createVariantAsync({
      name: 'ccrouter',
      providerKey: 'ccrouter',
      apiKey: '',
      claudeVersion: 'stable',
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
  } finally {
    cleanup(rootDir);
    cleanup(binDir);
  }
});

test('mirror brand preset writes tweakcc config and disables prompt pack', async () => {
  const rootDir = makeTempDir();
  const binDir = makeTempDir();

  try {
    await core.createVariantAsync({
      name: 'mirror-test',
      providerKey: 'mirror',
      apiKey: '',
      claudeVersion: 'stable',
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

    // Verify variant.json has prompt pack disabled
    const variantPath = path.join(rootDir, 'mirror-test', 'variant.json');
    const variant = JSON.parse(readFile(variantPath)) as { promptPack?: boolean };
    assert.equal(variant.promptPack, false, 'mirror provider should have promptPack disabled');

    // Verify settings.json has no auth overrides (pure Claude Code)
    const settingsPath = path.join(rootDir, 'mirror-test', 'config', 'settings.json');
    const settings = JSON.parse(readFile(settingsPath)) as { env?: Record<string, unknown> };
    assert.ok(!settings.env?.ANTHROPIC_BASE_URL, 'mirror should not set ANTHROPIC_BASE_URL');
    assert.ok(!settings.env?.ANTHROPIC_API_KEY, 'mirror should not set ANTHROPIC_API_KEY');
    assert.ok(settings.env?.CC_MIRROR_SPLASH, 'mirror should set splash env');
  } finally {
    cleanup(rootDir);
    cleanup(binDir);
  }
});

test('api key approvals are written to .claude.json', async () => {
  const rootDir = makeTempDir();
  const binDir = makeTempDir();

  const apiKey = 'sk-test-1234567890abcdefghijklmnopqrstuvwxyz';

  try {
    await core.createVariantAsync({
      name: 'beta',
      providerKey: 'custom',
      baseUrl: 'http://localhost:4000/anthropic',
      apiKey,
      claudeVersion: 'stable',
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
  } finally {
    cleanup(rootDir);
    cleanup(binDir);
  }
});

test('settingsOnly update preserves binary and only updates settings', () => {
  const rootDir = makeTempDir();
  const binDir = makeTempDir();

  return (async () => {
    await core.createVariantAsync({
      name: 'gamma',
      providerKey: 'openrouter',
      apiKey: 'or-key',
      claudeVersion: 'stable',
      rootDir,
      binDir,
      noTweak: true,
      tweakccStdio: 'pipe',
    });

    const variantDir = path.join(rootDir, 'gamma');
    const nativeDir = path.join(variantDir, 'native');
    const binaryPath = resolveNativeClaudePath(nativeDir);

    const marker = '\ncc-mirror-settings-only-test\n';
    fs.appendFileSync(binaryPath, marker);
    const beforeUpdate = readFile(binaryPath);

    // Update with settingsOnly - should NOT reinstall Claude Code binary
    await core.updateVariantAsync(rootDir, 'gamma', {
      settingsOnly: true,
      noTweak: true,
      tweakccStdio: 'pipe',
      modelOverrides: {
        sonnet: 'anthropic/claude-sonnet',
        haiku: 'anthropic/claude-haiku',
      },
    });

    const afterUpdate = readFile(binaryPath);
    assert.equal(afterUpdate, beforeUpdate, 'settingsOnly update should keep binary intact');
    assert.ok(afterUpdate.includes('cc-mirror-settings-only-test'), 'settingsOnly update should keep binary intact');

    // But settings should be updated with model overrides
    const configPath = path.join(variantDir, 'config', 'settings.json');
    const configJson = JSON.parse(readFile(configPath)) as {
      env: Record<string, string>;
    };
    assert.equal(configJson.env.ANTHROPIC_DEFAULT_SONNET_MODEL, 'anthropic/claude-sonnet');
    assert.equal(configJson.env.ANTHROPIC_DEFAULT_HAIKU_MODEL, 'anthropic/claude-haiku');
    assert.equal(
      configJson.env.ANTHROPIC_SMALL_FAST_MODEL,
      'anthropic/claude-haiku',
      'small-fast model should follow haiku alias when haiku is updated'
    );

    cleanup(rootDir);
    cleanup(binDir);
  })();
});
