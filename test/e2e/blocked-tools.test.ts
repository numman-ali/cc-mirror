/**
 * E2E Tests - Provider Tool Denies
 *
 * Verifies that cc-mirror enforces provider-specific tool restrictions via
 * Claude Code's native settings.json permissions (not tweakcc toolsets).
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import * as core from '../../src/core/index.js';
import { MINIMAX_DENY_TOOLS, ZAI_DENY_TOOLS } from '../../src/core/claude-config.js';
import { makeTempDir, readFile, cleanup } from '../helpers/index.js';

test('E2E: Tool denies', async (t) => {
  const createdDirs: string[] = [];

  t.after(() => {
    for (const dir of createdDirs) {
      cleanup(dir);
    }
  });

  await t.test('zai settings.json denies provider-injected tools + built-in web tools', async () => {
    const rootDir = makeTempDir();
    const binDir = makeTempDir();
    createdDirs.push(rootDir, binDir);

    await core.createVariantAsync({
      name: 'test-zai-deny',
      providerKey: 'zai',
      apiKey: 'test-key',
      claudeVersion: 'stable',
      rootDir,
      binDir,
      promptPack: false,
      skillInstall: false,
      noTweak: true,
      tweakccStdio: 'pipe',
    });

    const variantDir = path.join(rootDir, 'test-zai-deny');
    const settingsPath = path.join(variantDir, 'config', 'settings.json');

    assert.ok(fs.existsSync(settingsPath), 'settings.json should exist');

    const settings = JSON.parse(readFile(settingsPath));
    const deny = settings.permissions?.deny;
    assert.ok(Array.isArray(deny), 'permissions.deny should be an array');

    for (const tool of ZAI_DENY_TOOLS) {
      assert.ok(deny.includes(tool), `zai should deny ${tool}`);
    }
  });

  await t.test('minimax settings.json denies WebSearch', async () => {
    const rootDir = makeTempDir();
    const binDir = makeTempDir();
    createdDirs.push(rootDir, binDir);

    await core.createVariantAsync({
      name: 'test-minimax-deny',
      providerKey: 'minimax',
      apiKey: 'test-key',
      claudeVersion: 'stable',
      rootDir,
      binDir,
      promptPack: false,
      skillInstall: false,
      noTweak: true,
      tweakccStdio: 'pipe',
    });

    const variantDir = path.join(rootDir, 'test-minimax-deny');
    const settingsPath = path.join(variantDir, 'config', 'settings.json');

    assert.ok(fs.existsSync(settingsPath), 'settings.json should exist');

    const settings = JSON.parse(readFile(settingsPath));
    const deny = settings.permissions?.deny;
    assert.ok(Array.isArray(deny), 'permissions.deny should be an array');

    for (const tool of MINIMAX_DENY_TOOLS) {
      assert.ok(deny.includes(tool), `minimax should deny ${tool}`);
    }
  });
});
