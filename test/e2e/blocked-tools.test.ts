/**
 * E2E Tests - Blocked Tools Configuration
 *
 * Tests that provider toolsets correctly block specified tools and
 * team mode merges blocked tools with TodoWrite.
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
  const teamModeSupported = core.TEAM_MODE_SUPPORTED;

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
      enableTeamMode: false,
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
      enableTeamMode: false,
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

  await t.test('team mode merges blocked tools with TodoWrite for zai', { skip: !teamModeSupported }, () => {
    const rootDir = makeTempDir();
    const binDir = makeTempDir();
    createdDirs.push(rootDir, binDir);

    core.createVariant({
      name: 'test-zai-team',
      providerKey: 'zai',
      apiKey: 'test-key',
      rootDir,
      binDir,
      enableTeamMode: true,
      promptPack: false,
      skillInstall: false,
      noTweak: true,
      tweakccStdio: 'pipe',
    });

    const variantDir = path.join(rootDir, 'test-zai-team');
    const configPath = path.join(variantDir, 'tweakcc', 'config.json');

    const config = JSON.parse(readFile(configPath));
    const teamToolset = config.settings?.toolsets?.find((t: { name: string }) => t.name === 'team');

    assert.ok(teamToolset, 'team toolset should exist');
    assert.ok(Array.isArray(teamToolset.blockedTools), 'blockedTools should be an array');

    // Verify TodoWrite is blocked
    assert.ok(teamToolset.blockedTools.includes('TodoWrite'), 'team toolset should block TodoWrite');

    // Verify zai blocked tools are also present (merged)
    for (const tool of ZAI_BLOCKED_TOOLS) {
      assert.ok(teamToolset.blockedTools.includes(tool), `team toolset should include inherited blocked tool ${tool}`);
    }

    // Verify default toolset is team
    assert.equal(config.settings.defaultToolset, 'team', 'default toolset should be team');
  });

  await t.test('team mode merges blocked tools with TodoWrite for minimax', { skip: !teamModeSupported }, () => {
    const rootDir = makeTempDir();
    const binDir = makeTempDir();
    createdDirs.push(rootDir, binDir);

    core.createVariant({
      name: 'test-minimax-team',
      providerKey: 'minimax',
      apiKey: 'test-key',
      rootDir,
      binDir,
      enableTeamMode: true,
      promptPack: false,
      skillInstall: false,
      noTweak: true,
      tweakccStdio: 'pipe',
    });

    const variantDir = path.join(rootDir, 'test-minimax-team');
    const configPath = path.join(variantDir, 'tweakcc', 'config.json');

    const config = JSON.parse(readFile(configPath));
    const teamToolset = config.settings?.toolsets?.find((t: { name: string }) => t.name === 'team');

    assert.ok(teamToolset, 'team toolset should exist');
    assert.ok(Array.isArray(teamToolset.blockedTools), 'blockedTools should be an array');

    // Verify TodoWrite is blocked
    assert.ok(teamToolset.blockedTools.includes('TodoWrite'), 'team toolset should block TodoWrite');

    // Verify minimax blocked tools are also present (merged)
    for (const tool of MINIMAX_BLOCKED_TOOLS) {
      assert.ok(teamToolset.blockedTools.includes(tool), `team toolset should include inherited blocked tool ${tool}`);
    }

    // Verify default toolset is team
    assert.equal(config.settings.defaultToolset, 'team', 'default toolset should be team');
  });
});
