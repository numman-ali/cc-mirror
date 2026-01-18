/**
 * E2E Tests - Team Mode Feature
 *
 * Tests team mode enable/disable functionality:
 * - cli.js patching
 * - orchestrator skill installation
 * - variant.json metadata
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import * as core from '../../src/core/index.js';
import { TEAM_PACK_FILES } from '../../src/team-pack/index.js';
import { detectTeamModeState } from '../../src/core/variant-builder/team-mode-patch.js';
import { makeTempDir, readFile, cleanup } from '../helpers/index.js';

const testTeamMode = core.TEAM_MODE_SUPPORTED ? test : test.skip;

testTeamMode('E2E: Team Mode', async (t) => {
  const createdDirs: string[] = [];

  t.after(() => {
    for (const dir of createdDirs) {
      cleanup(dir);
    }
  });

  await t.test('enables team mode and patches cli.js', () => {
    const rootDir = makeTempDir();
    const binDir = makeTempDir();
    createdDirs.push(rootDir, binDir);

    const result = core.createVariant({
      name: 'test-team-enabled',
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

    // Verify variant was created
    const variantDir = path.join(rootDir, 'test-team-enabled');
    assert.ok(fs.existsSync(variantDir), 'variant dir should exist');

    // Verify cli.js was patched
    const cliPath = path.join(variantDir, 'npm', 'node_modules', '@anthropic-ai', 'claude-code', 'cli.js');
    const cliContent = readFile(cliPath);
    assert.equal(detectTeamModeState(cliContent), 'enabled', 'cli.js should have team mode enabled');

    // Verify orchestrator skill installed
    const skillPath = path.join(variantDir, 'config', 'skills', 'orchestration');
    assert.ok(fs.existsSync(skillPath), 'orchestrator skill directory should exist');
    assert.ok(fs.existsSync(path.join(skillPath, 'SKILL.md')), 'SKILL.md should exist');

    // Verify marker file
    const markerPath = path.join(skillPath, '.cc-mirror-managed');
    assert.ok(fs.existsSync(markerPath), 'managed marker should exist');

    // Verify variant.json has teamModeEnabled
    const metaPath = path.join(variantDir, 'variant.json');
    const meta = JSON.parse(readFile(metaPath));
    assert.equal(meta.teamModeEnabled, true, 'variant.json should have teamModeEnabled: true');

    // Verify result notes mention team mode
    assert.ok(
      result.notes?.some((note) => note.includes('Team mode')),
      'notes should mention team mode'
    );
  });

  await t.test('skips team mode when not enabled', () => {
    const rootDir = makeTempDir();
    const binDir = makeTempDir();
    createdDirs.push(rootDir, binDir);

    core.createVariant({
      name: 'test-team-disabled',
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

    const variantDir = path.join(rootDir, 'test-team-disabled');

    // Verify cli.js was NOT patched
    const cliPath = path.join(variantDir, 'npm', 'node_modules', '@anthropic-ai', 'claude-code', 'cli.js');
    const cliContent = readFile(cliPath);
    assert.equal(detectTeamModeState(cliContent), 'disabled', 'cli.js should have team mode disabled');

    // Verify orchestrator skill NOT installed
    const skillPath = path.join(variantDir, 'config', 'skills', 'orchestration');
    assert.ok(!fs.existsSync(skillPath), 'orchestrator skill should not be installed');

    // Verify variant.json does not have teamModeEnabled
    const metaPath = path.join(variantDir, 'variant.json');
    const meta = JSON.parse(readFile(metaPath));
    assert.ok(!meta.teamModeEnabled, 'variant.json should not have teamModeEnabled: true');
  });

  await t.test('mirror provider auto-enables team mode', () => {
    const rootDir = makeTempDir();
    const binDir = makeTempDir();
    createdDirs.push(rootDir, binDir);

    core.createVariant({
      name: 'test-mirror',
      providerKey: 'mirror',
      rootDir,
      binDir,
      promptPack: false,
      skillInstall: false,
      noTweak: true,
      tweakccStdio: 'pipe',
    });

    const variantDir = path.join(rootDir, 'test-mirror');

    // Mirror provider should auto-enable team mode
    const cliPath = path.join(variantDir, 'npm', 'node_modules', '@anthropic-ai', 'claude-code', 'cli.js');
    const cliContent = readFile(cliPath);
    assert.equal(detectTeamModeState(cliContent), 'enabled', 'mirror should auto-enable team mode');

    // Verify orchestrator skill installed
    const skillPath = path.join(variantDir, 'config', 'skills', 'orchestration');
    assert.ok(fs.existsSync(skillPath), 'orchestrator skill should be auto-installed for mirror');
  });

  await t.test('team mode can be toggled via update', () => {
    const rootDir = makeTempDir();
    const binDir = makeTempDir();
    createdDirs.push(rootDir, binDir);

    // Create without team mode
    core.createVariant({
      name: 'test-toggle',
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

    const variantDir = path.join(rootDir, 'test-toggle');
    const cliPath = path.join(variantDir, 'npm', 'node_modules', '@anthropic-ai', 'claude-code', 'cli.js');

    // Verify initially disabled
    let cliContent = readFile(cliPath);
    assert.equal(detectTeamModeState(cliContent), 'disabled', 'should start with team mode disabled');

    // Enable via update (noTweak to keep test deterministic)
    core.updateVariant(rootDir, 'test-toggle', {
      binDir,
      enableTeamMode: true,
      noTweak: true,
    });

    // Verify now enabled
    cliContent = readFile(cliPath);
    assert.equal(detectTeamModeState(cliContent), 'enabled', 'should have team mode enabled after update');

    // Verify skill installed
    const skillPath = path.join(variantDir, 'config', 'skills', 'orchestration');
    assert.ok(fs.existsSync(skillPath), 'skill should be installed after enabling');

    // Disable via update (noTweak to keep test deterministic)
    core.updateVariant(rootDir, 'test-toggle', {
      binDir,
      disableTeamMode: true,
      noTweak: true,
    });

    // Verify disabled again
    cliContent = readFile(cliPath);
    assert.equal(detectTeamModeState(cliContent), 'disabled', 'should have team mode disabled after update');

    // Verify skill removed
    assert.ok(!fs.existsSync(skillPath), 'skill should be removed after disabling');
  });

  await t.test('team pack prompts are installed when team mode enabled', () => {
    const rootDir = makeTempDir();
    const binDir = makeTempDir();
    createdDirs.push(rootDir, binDir);

    core.createVariant({
      name: 'test-team-pack',
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

    const variantDir = path.join(rootDir, 'test-team-pack');
    const systemPromptsDir = path.join(variantDir, 'tweakcc', 'system-prompts');

    // Verify all team pack prompt files are installed
    for (const file of TEAM_PACK_FILES) {
      const targetPath = path.join(systemPromptsDir, file.target);
      assert.ok(fs.existsSync(targetPath), `team pack file ${file.target} should exist`);

      // Verify content is not empty
      const content = fs.readFileSync(targetPath, 'utf8');
      assert.ok(content.length > 0, `team pack file ${file.target} should have content`);
    }
  });

  await t.test('team pack toolset configures TodoWrite blocking', () => {
    const rootDir = makeTempDir();
    const binDir = makeTempDir();
    createdDirs.push(rootDir, binDir);

    core.createVariant({
      name: 'test-team-toolset',
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

    const variantDir = path.join(rootDir, 'test-team-toolset');
    const tweakccConfigPath = path.join(variantDir, 'tweakcc', 'config.json'); // tweakcc/config.json

    // Verify tweakcc config exists
    assert.ok(fs.existsSync(tweakccConfigPath), 'tweakcc config should exist');

    // Parse and verify toolset configuration
    const config = JSON.parse(readFile(tweakccConfigPath));

    // Check that settings.toolsets exists and has team toolset
    assert.ok(config.settings?.toolsets, 'toolsets array should exist');
    const teamToolset = config.settings.toolsets.find((t: { name: string }) => t.name === 'team');
    assert.ok(teamToolset, 'team toolset should exist');

    // Verify TodoWrite is blocked
    assert.ok(
      Array.isArray(teamToolset.blockedTools) && teamToolset.blockedTools.includes('TodoWrite'),
      'TodoWrite should be in blockedTools'
    );

    // Verify default toolset is set to team
    assert.equal(config.settings.defaultToolset, 'team', 'defaultToolset should be team');
    assert.equal(config.settings.planModeToolset, 'team', 'planModeToolset should be team');
  });

  await t.test('team pack prompts are NOT installed when team mode disabled', () => {
    const rootDir = makeTempDir();
    const binDir = makeTempDir();
    createdDirs.push(rootDir, binDir);

    core.createVariant({
      name: 'test-no-team-pack',
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

    const variantDir = path.join(rootDir, 'test-no-team-pack');
    const systemPromptsDir = path.join(variantDir, 'tweakcc', 'system-prompts');

    // Verify team pack prompt files are NOT installed
    for (const file of TEAM_PACK_FILES) {
      const targetPath = path.join(systemPromptsDir, file.target);
      assert.ok(!fs.existsSync(targetPath), `team pack file ${file.target} should NOT exist when team mode disabled`);
    }
  });
});
