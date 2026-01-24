/**
 * E2E Tests - Blocked Tools Configuration
 *
 * Tests that provider toolsets correctly block specified tools and
 * provider brand presets include their expected blockedTools.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import * as core from '../../src/core/index.js';
import { ZAI_BLOCKED_TOOLS } from '../../src/brands/zai.js';
import { MINIMAX_BLOCKED_TOOLS } from '../../src/brands/minimax.js';
import { makeTempDir, readFile, cleanup } from '../helpers/index.js';

test('E2E: Blocked Tools', async (t) => {
  const createdDirs: string[] = [];

  t.after(() => {
    for (const dir of createdDirs) {
      cleanup(dir);
    }
  });

  await t.test('zai brand has blocked tools configured', () => {
    const rootDir = makeTempDir();
    const binDir = makeTempDir();
    createdDirs.push(rootDir, binDir);

    core.createVariant({
      name: 'test-zai-blocked',
      providerKey: 'zai',
      apiKey: 'test-key',
      rootDir,
      binDir,
      promptPack: false,
      skillInstall: false,
      noTweak: true,
      tweakccStdio: 'pipe',
    });

    const variantDir = path.join(rootDir, 'test-zai-blocked');
    const configPath = path.join(variantDir, 'tweakcc', 'config.json');

    assert.ok(fs.existsSync(configPath), 'tweakcc config should exist');

    const config = JSON.parse(readFile(configPath));
    const zaiToolset = config.settings?.toolsets?.find((t: { name: string }) => t.name === 'zai');

    assert.ok(zaiToolset, 'zai toolset should exist');
    assert.ok(Array.isArray(zaiToolset.blockedTools), 'blockedTools should be an array');

    // Verify all expected tools are blocked
    for (const tool of ZAI_BLOCKED_TOOLS) {
      assert.ok(zaiToolset.blockedTools.includes(tool), `zai toolset should block ${tool}`);
    }

    // Verify default toolset is zai
    assert.equal(config.settings.defaultToolset, 'zai', 'default toolset should be zai');
  });

  await t.test('minimax brand has blocked tools configured', () => {
    const rootDir = makeTempDir();
    const binDir = makeTempDir();
    createdDirs.push(rootDir, binDir);

    core.createVariant({
      name: 'test-minimax-blocked',
      providerKey: 'minimax',
      apiKey: 'test-key',
      rootDir,
      binDir,
      promptPack: false,
      skillInstall: false,
      noTweak: true,
      tweakccStdio: 'pipe',
    });

    const variantDir = path.join(rootDir, 'test-minimax-blocked');
    const configPath = path.join(variantDir, 'tweakcc', 'config.json');

    assert.ok(fs.existsSync(configPath), 'tweakcc config should exist');

    const config = JSON.parse(readFile(configPath));
    const minimaxToolset = config.settings?.toolsets?.find((t: { name: string }) => t.name === 'minimax');

    assert.ok(minimaxToolset, 'minimax toolset should exist');
    assert.ok(Array.isArray(minimaxToolset.blockedTools), 'blockedTools should be an array');

    // Verify all expected tools are blocked
    for (const tool of MINIMAX_BLOCKED_TOOLS) {
      assert.ok(minimaxToolset.blockedTools.includes(tool), `minimax toolset should block ${tool}`);
    }

    // Verify default toolset is minimax
    assert.equal(config.settings.defaultToolset, 'minimax', 'default toolset should be minimax');
  });
});
