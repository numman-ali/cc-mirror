/**
 * E2E Tests - Amazon Bedrock Provider
 *
 * Tests Bedrock-specific configuration including CLAUDE_CODE_USE_BEDROCK,
 * AWS_REGION, model mapping (like OpenRouter), and AWS credential handling.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import * as core from '../../src/core/index.js';
import { getWrapperPath, getWrapperScriptPath } from '../../src/core/paths.js';
import { makeTempDir, readFile, cleanup } from '../helpers/index.js';

const isWindows = process.platform === 'win32';

// Example Bedrock model IDs
const BEDROCK_MODELS = {
  // Regional (us.) prefix
  sonnet: 'us.anthropic.claude-sonnet-4-5-20250929-v1:0',
  opus: 'us.anthropic.claude-opus-4-5-20251101-v1:0',
  haiku: 'us.anthropic.claude-haiku-4-5-20251001-v1:0',
  // Global inference profile prefix
  sonnetGlobal: 'global.anthropic.claude-sonnet-4-5-20250929-v1:0',
  opusGlobal: 'global.anthropic.claude-opus-4-5-20251101-v1:0',
  haikuGlobal: 'global.anthropic.claude-haiku-4-5-20251001-v1:0',
};

test('E2E: Bedrock Provider', async (t) => {
  const createdDirs: string[] = [];

  t.after(() => {
    for (const dir of createdDirs) {
      cleanup(dir);
    }
  });

  await t.test('CLAUDE_CODE_USE_BEDROCK is set to 1 in settings.json', () => {
    const rootDir = makeTempDir();
    const binDir = makeTempDir();
    createdDirs.push(rootDir, binDir);

    core.createVariant({
      name: 'test-bedrock-use',
      providerKey: 'bedrock',
      apiKey: '',
      rootDir,
      binDir,
      brand: 'bedrock',
      promptPack: false,
      skillInstall: false,
      noTweak: true,
      tweakccStdio: 'pipe',
    });

    const variantDir = path.join(rootDir, 'test-bedrock-use');
    const configPath = path.join(variantDir, 'config', 'settings.json');
    const config = JSON.parse(readFile(configPath)) as { env: Record<string, string> };

    assert.equal(
      config.env.CLAUDE_CODE_USE_BEDROCK,
      '1',
      'CLAUDE_CODE_USE_BEDROCK must be set to "1" for Bedrock mode'
    );
  });

  await t.test('default AWS_REGION is us-east-1', () => {
    const rootDir = makeTempDir();
    const binDir = makeTempDir();
    createdDirs.push(rootDir, binDir);

    core.createVariant({
      name: 'test-bedrock-region',
      providerKey: 'bedrock',
      apiKey: '',
      rootDir,
      binDir,
      brand: 'bedrock',
      promptPack: false,
      skillInstall: false,
      noTweak: true,
      tweakccStdio: 'pipe',
    });

    const variantDir = path.join(rootDir, 'test-bedrock-region');
    const configPath = path.join(variantDir, 'config', 'settings.json');
    const config = JSON.parse(readFile(configPath)) as { env: Record<string, string> };

    assert.equal(config.env.AWS_REGION, 'us-east-1', 'default AWS_REGION should be us-east-1');
  });

  await t.test('no model IDs are hardcoded (requiresModelMapping)', () => {
    const rootDir = makeTempDir();
    const binDir = makeTempDir();
    createdDirs.push(rootDir, binDir);

    core.createVariant({
      name: 'test-bedrock-no-defaults',
      providerKey: 'bedrock',
      apiKey: '',
      rootDir,
      binDir,
      brand: 'bedrock',
      promptPack: false,
      skillInstall: false,
      noTweak: true,
      tweakccStdio: 'pipe',
    });

    const variantDir = path.join(rootDir, 'test-bedrock-no-defaults');
    const configPath = path.join(variantDir, 'config', 'settings.json');
    const config = JSON.parse(readFile(configPath)) as { env: Record<string, string> };

    // No hardcoded model IDs - user must provide them
    assert.ok(!Object.hasOwn(config.env, 'ANTHROPIC_DEFAULT_SONNET_MODEL'), 'No default sonnet model should be set');
    assert.ok(!Object.hasOwn(config.env, 'ANTHROPIC_DEFAULT_OPUS_MODEL'), 'No default opus model should be set');
    assert.ok(!Object.hasOwn(config.env, 'ANTHROPIC_DEFAULT_HAIKU_MODEL'), 'No default haiku model should be set');
  });

  await t.test('model overrides work via modelOverrides (regional us. prefix)', () => {
    const rootDir = makeTempDir();
    const binDir = makeTempDir();
    createdDirs.push(rootDir, binDir);

    core.createVariant({
      name: 'test-bedrock-models-regional',
      providerKey: 'bedrock',
      apiKey: '',
      rootDir,
      binDir,
      brand: 'bedrock',
      modelOverrides: {
        sonnet: BEDROCK_MODELS.sonnet,
        opus: BEDROCK_MODELS.opus,
        haiku: BEDROCK_MODELS.haiku,
        smallFast: BEDROCK_MODELS.haiku,
      },
      promptPack: false,
      skillInstall: false,
      noTweak: true,
      tweakccStdio: 'pipe',
    });

    const variantDir = path.join(rootDir, 'test-bedrock-models-regional');
    const configPath = path.join(variantDir, 'config', 'settings.json');
    const config = JSON.parse(readFile(configPath)) as { env: Record<string, string> };

    assert.equal(config.env.ANTHROPIC_DEFAULT_SONNET_MODEL, BEDROCK_MODELS.sonnet);
    assert.equal(config.env.ANTHROPIC_DEFAULT_OPUS_MODEL, BEDROCK_MODELS.opus);
    assert.equal(config.env.ANTHROPIC_DEFAULT_HAIKU_MODEL, BEDROCK_MODELS.haiku);
    assert.equal(config.env.ANTHROPIC_SMALL_FAST_MODEL, BEDROCK_MODELS.haiku);
  });

  await t.test('model overrides work with global inference profile prefix', () => {
    const rootDir = makeTempDir();
    const binDir = makeTempDir();
    createdDirs.push(rootDir, binDir);

    core.createVariant({
      name: 'test-bedrock-models-global',
      providerKey: 'bedrock',
      apiKey: '',
      rootDir,
      binDir,
      brand: 'bedrock',
      modelOverrides: {
        sonnet: BEDROCK_MODELS.sonnetGlobal,
        opus: BEDROCK_MODELS.opusGlobal,
        haiku: BEDROCK_MODELS.haikuGlobal,
        smallFast: BEDROCK_MODELS.haikuGlobal,
      },
      promptPack: false,
      skillInstall: false,
      noTweak: true,
      tweakccStdio: 'pipe',
    });

    const variantDir = path.join(rootDir, 'test-bedrock-models-global');
    const configPath = path.join(variantDir, 'config', 'settings.json');
    const config = JSON.parse(readFile(configPath)) as { env: Record<string, string> };

    // Global prefix enables cross-region routing
    assert.equal(config.env.ANTHROPIC_DEFAULT_SONNET_MODEL, BEDROCK_MODELS.sonnetGlobal);
    assert.equal(config.env.ANTHROPIC_DEFAULT_OPUS_MODEL, BEDROCK_MODELS.opusGlobal);
    assert.equal(config.env.ANTHROPIC_DEFAULT_HAIKU_MODEL, BEDROCK_MODELS.haikuGlobal);
    assert.equal(config.env.ANTHROPIC_SMALL_FAST_MODEL, BEDROCK_MODELS.haikuGlobal);
  });

  await t.test('custom inference profile ARNs work via modelOverrides', () => {
    const rootDir = makeTempDir();
    const binDir = makeTempDir();
    createdDirs.push(rootDir, binDir);

    const profileArn = 'arn:aws:bedrock:us-east-1:123456789012:inference-profile/my-custom-profile';

    core.createVariant({
      name: 'test-bedrock-profile-arn',
      providerKey: 'bedrock',
      apiKey: '',
      rootDir,
      binDir,
      brand: 'bedrock',
      modelOverrides: {
        sonnet: profileArn,
        opus: profileArn,
        haiku: profileArn,
      },
      promptPack: false,
      skillInstall: false,
      noTweak: true,
      tweakccStdio: 'pipe',
    });

    const variantDir = path.join(rootDir, 'test-bedrock-profile-arn');
    const configPath = path.join(variantDir, 'config', 'settings.json');
    const config = JSON.parse(readFile(configPath)) as { env: Record<string, string> };

    assert.equal(
      config.env.ANTHROPIC_DEFAULT_SONNET_MODEL,
      profileArn,
      'custom inference profile ARN should work as model ID'
    );
  });

  await t.test('no ANTHROPIC_API_KEY or ANTHROPIC_AUTH_TOKEN set', () => {
    const rootDir = makeTempDir();
    const binDir = makeTempDir();
    createdDirs.push(rootDir, binDir);

    core.createVariant({
      name: 'test-bedrock-no-auth',
      providerKey: 'bedrock',
      apiKey: '',
      rootDir,
      binDir,
      brand: 'bedrock',
      promptPack: false,
      skillInstall: false,
      noTweak: true,
      tweakccStdio: 'pipe',
    });

    const variantDir = path.join(rootDir, 'test-bedrock-no-auth');
    const configPath = path.join(variantDir, 'config', 'settings.json');
    const config = JSON.parse(readFile(configPath)) as { env: Record<string, string> };

    assert.ok(
      !Object.hasOwn(config.env, 'ANTHROPIC_API_KEY'),
      'ANTHROPIC_API_KEY should not be set (AWS auth handled externally)'
    );
    assert.ok(
      !Object.hasOwn(config.env, 'ANTHROPIC_AUTH_TOKEN'),
      'ANTHROPIC_AUTH_TOKEN should not be set (AWS auth handled externally)'
    );
  });

  await t.test('no ANTHROPIC_BASE_URL set', () => {
    const rootDir = makeTempDir();
    const binDir = makeTempDir();
    createdDirs.push(rootDir, binDir);

    core.createVariant({
      name: 'test-bedrock-no-baseurl',
      providerKey: 'bedrock',
      apiKey: '',
      rootDir,
      binDir,
      brand: 'bedrock',
      promptPack: false,
      skillInstall: false,
      noTweak: true,
      tweakccStdio: 'pipe',
    });

    const variantDir = path.join(rootDir, 'test-bedrock-no-baseurl');
    const configPath = path.join(variantDir, 'config', 'settings.json');
    const config = JSON.parse(readFile(configPath)) as { env: Record<string, string> };

    assert.ok(
      !Object.hasOwn(config.env, 'ANTHROPIC_BASE_URL'),
      'ANTHROPIC_BASE_URL should not be set (Bedrock uses SDK internally)'
    );
  });

  await t.test('CC_MIRROR_UNSET_AUTH_TOKEN is NOT set (authMode is none)', () => {
    const rootDir = makeTempDir();
    const binDir = makeTempDir();
    createdDirs.push(rootDir, binDir);

    core.createVariant({
      name: 'test-bedrock-unset-token',
      providerKey: 'bedrock',
      apiKey: '',
      rootDir,
      binDir,
      brand: 'bedrock',
      promptPack: false,
      skillInstall: false,
      noTweak: true,
      tweakccStdio: 'pipe',
    });

    const variantDir = path.join(rootDir, 'test-bedrock-unset-token');
    const configPath = path.join(variantDir, 'config', 'settings.json');
    const config = JSON.parse(readFile(configPath)) as { env: Record<string, string> };

    assert.ok(
      !Object.hasOwn(config.env, 'CC_MIRROR_UNSET_AUTH_TOKEN'),
      'CC_MIRROR_UNSET_AUTH_TOKEN should not be set for authMode=none'
    );
  });

  await t.test('wrapper script contains bedrock splash art', () => {
    const rootDir = makeTempDir();
    const binDir = makeTempDir();
    createdDirs.push(rootDir, binDir);

    core.createVariant({
      name: 'test-bedrock-splash',
      providerKey: 'bedrock',
      apiKey: '',
      rootDir,
      binDir,
      brand: 'bedrock',
      promptPack: false,
      skillInstall: false,
      noTweak: true,
      tweakccStdio: 'pipe',
    });

    const wrapperPath = getWrapperPath(binDir, 'test-bedrock-splash');
    const scriptPath = getWrapperScriptPath(binDir, 'test-bedrock-splash');
    const wrapperContent = readFile(isWindows ? scriptPath : wrapperPath);

    // Verify bedrock case is in wrapper
    if (isWindows) {
      assert.ok(wrapperContent.includes('"bedrock"'), 'wrapper should include bedrock splash style');
    } else {
      assert.ok(wrapperContent.includes('bedrock)'), 'wrapper should have case for bedrock splash style');
    }

    // Verify Bedrock ASCII art is present (check for the tagline)
    assert.ok(wrapperContent.includes('Amazon Bedrock'), 'wrapper should contain Amazon Bedrock in splash art');
  });

  await t.test('AWS_REGION can be overridden via extraEnv', () => {
    const rootDir = makeTempDir();
    const binDir = makeTempDir();
    createdDirs.push(rootDir, binDir);

    core.createVariant({
      name: 'test-bedrock-region-override',
      providerKey: 'bedrock',
      apiKey: '',
      rootDir,
      binDir,
      brand: 'bedrock',
      extraEnv: ['AWS_REGION=eu-west-1'],
      promptPack: false,
      skillInstall: false,
      noTweak: true,
      tweakccStdio: 'pipe',
    });

    const variantDir = path.join(rootDir, 'test-bedrock-region-override');
    const configPath = path.join(variantDir, 'config', 'settings.json');
    const config = JSON.parse(readFile(configPath)) as { env: Record<string, string> };

    assert.equal(config.env.AWS_REGION, 'eu-west-1', 'AWS_REGION should be overridden via extraEnv');
  });

  await t.test('AWS_BEARER_TOKEN_BEDROCK can be passed through via extraEnv', () => {
    const rootDir = makeTempDir();
    const binDir = makeTempDir();
    createdDirs.push(rootDir, binDir);

    core.createVariant({
      name: 'test-bedrock-bearer',
      providerKey: 'bedrock',
      apiKey: '',
      rootDir,
      binDir,
      brand: 'bedrock',
      extraEnv: ['AWS_BEARER_TOKEN_BEDROCK=test-bearer-token'],
      promptPack: false,
      skillInstall: false,
      noTweak: true,
      tweakccStdio: 'pipe',
    });

    const variantDir = path.join(rootDir, 'test-bedrock-bearer');
    const configPath = path.join(variantDir, 'config', 'settings.json');
    const config = JSON.parse(readFile(configPath)) as { env: Record<string, string> };

    assert.equal(
      config.env.AWS_BEARER_TOKEN_BEDROCK,
      'test-bearer-token',
      'AWS_BEARER_TOKEN_BEDROCK should be passed through'
    );
  });

  await t.test('bedrock brand has correct theme ID', () => {
    const rootDir = makeTempDir();
    const binDir = makeTempDir();
    createdDirs.push(rootDir, binDir);

    core.createVariant({
      name: 'test-bedrock-theme',
      providerKey: 'bedrock',
      apiKey: '',
      rootDir,
      binDir,
      brand: 'bedrock',
      promptPack: false,
      skillInstall: false,
      noTweak: true,
      tweakccStdio: 'pipe',
    });

    const variantDir = path.join(rootDir, 'test-bedrock-theme');
    const tweakConfigPath = path.join(variantDir, 'tweakcc', 'config.json');
    const tweakConfig = JSON.parse(readFile(tweakConfigPath)) as {
      settings?: { themes?: { id?: string }[] };
    };

    assert.equal(
      tweakConfig.settings?.themes?.[0]?.id,
      'bedrock-aws',
      'bedrock brand should have bedrock-aws theme ID'
    );
  });

  await t.test('bedrock toolset has no blocked tools', () => {
    const rootDir = makeTempDir();
    const binDir = makeTempDir();
    createdDirs.push(rootDir, binDir);

    core.createVariant({
      name: 'test-bedrock-toolset',
      providerKey: 'bedrock',
      apiKey: '',
      rootDir,
      binDir,
      brand: 'bedrock',
      promptPack: false,
      skillInstall: false,
      noTweak: true,
      tweakccStdio: 'pipe',
    });

    const variantDir = path.join(rootDir, 'test-bedrock-toolset');
    const tweakConfigPath = path.join(variantDir, 'tweakcc', 'config.json');
    const tweakConfig = JSON.parse(readFile(tweakConfigPath));
    const bedrockToolset = tweakConfig.settings?.toolsets?.find((t: { name: string }) => t.name === 'bedrock');

    assert.ok(bedrockToolset, 'bedrock toolset should exist');
    assert.equal(bedrockToolset.allowedTools, '*', 'bedrock should allow all tools');
    assert.ok(
      !bedrockToolset.blockedTools || bedrockToolset.blockedTools.length === 0,
      'bedrock should have no blocked tools'
    );
  });

  await t.test('variant.json has correct provider metadata', () => {
    const rootDir = makeTempDir();
    const binDir = makeTempDir();
    createdDirs.push(rootDir, binDir);

    core.createVariant({
      name: 'test-bedrock-meta',
      providerKey: 'bedrock',
      apiKey: '',
      rootDir,
      binDir,
      brand: 'bedrock',
      promptPack: false,
      skillInstall: false,
      noTweak: true,
      tweakccStdio: 'pipe',
    });

    const variantMetaPath = path.join(rootDir, 'test-bedrock-meta', 'variant.json');
    const meta = JSON.parse(readFile(variantMetaPath)) as {
      name: string;
      provider: string;
    };

    assert.equal(meta.name, 'test-bedrock-meta');
    assert.equal(meta.provider, 'bedrock');
  });
});
