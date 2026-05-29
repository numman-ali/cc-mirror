/**
 * Tweakcc Configuration Tests
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ensureTweakccConfig } from '../../src/core/tweakcc.js';
import { buildBrandConfig } from '../../src/brands/index.js';
import { getManagedTweakccPatchIds } from '../../src/core/tweakcc-profile.js';
import { makeTempDir, cleanup } from '../helpers/index.js';

test('ensureTweakccConfig creates managed baseline when no brandKey provided', () => {
  const tweakDir = makeTempDir();
  const configPath = path.join(tweakDir, 'config.json');
  try {
    const result = ensureTweakccConfig(tweakDir, null);
    assert.equal(result, true);

    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    assert.equal(config.settings.misc.mcpConnectionNonBlocking, true);
    assert.equal(config.settings.misc.allowCustomAgentModels, true);
    assert.equal(config.settings.misc.enableModelCustomizations, false);
    assert.deepEqual(config.settings.claudeMdAltNames?.slice(0, 1), ['AGENTS.md']);
  } finally {
    cleanup(tweakDir);
  }
});

test('ensureTweakccConfig creates mirror-aware baseline without a brand', () => {
  const tweakDir = makeTempDir();
  try {
    const result = ensureTweakccConfig(tweakDir, undefined, { providerKey: 'mirror' });
    assert.equal(result, true);

    const config = JSON.parse(fs.readFileSync(path.join(tweakDir, 'config.json'), 'utf8'));
    assert.equal(config.settings.misc.enableModelCustomizations, false);
  } finally {
    cleanup(tweakDir);
  }
});

test('ensureTweakccConfig creates config file when it does not exist', () => {
  const tweakDir = makeTempDir();
  const configPath = path.join(tweakDir, 'config.json');

  try {
    const result = ensureTweakccConfig(tweakDir, 'zai');

    assert.equal(result, true);
    assert.ok(fs.existsSync(configPath));

    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    assert.ok(config.settings);
    assert.ok(config.settings.themes);
    assert.equal(config.settings.themes[0]?.id, 'dark');
    assert.equal(config.settings.themes[0]?.name, 'Z.ai Carbon');
    assert.equal(config.settings.misc.mcpConnectionNonBlocking, true);
    assert.equal(config.settings.misc.allowCustomAgentModels, true);
    assert.equal(config.settings.misc.enableModelCustomizations, false);
    assert.deepEqual(config.settings.claudeMdAltNames?.slice(0, 1), ['AGENTS.md']);
    assert.deepEqual(config.settings.toolsets, []);
    assert.equal(config.settings.defaultToolset, null);
    assert.equal(config.settings.planModeToolset, null);
    assert.deepEqual(config.settings.subagentModels, { plan: null, explore: null, generalPurpose: null });
    assert.deepEqual(config.settings.inputPatternHighlighters, []);
  } finally {
    cleanup(tweakDir);
  }
});

test('ensureTweakccConfig creates minimax config', () => {
  const tweakDir = makeTempDir();
  const configPath = path.join(tweakDir, 'config.json');

  try {
    const result = ensureTweakccConfig(tweakDir, 'minimax');

    assert.equal(result, true);
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    assert.equal(config.settings.themes[0]?.id, 'dark');
    assert.equal(config.settings.themes[0]?.name, 'MiniMax Nebula');
  } finally {
    cleanup(tweakDir);
  }
});

test('ensureTweakccConfig creates openrouter config', () => {
  const tweakDir = makeTempDir();
  const configPath = path.join(tweakDir, 'config.json');

  try {
    const result = ensureTweakccConfig(tweakDir, 'openrouter');

    assert.equal(result, true);
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    assert.equal(config.settings.themes[0]?.id, 'dark');
    assert.equal(config.settings.themes[0]?.name, 'OpenRouter Chrome');
  } finally {
    cleanup(tweakDir);
  }
});

test('ensureTweakccConfig creates ccrouter config', () => {
  const tweakDir = makeTempDir();
  const configPath = path.join(tweakDir, 'config.json');

  try {
    const result = ensureTweakccConfig(tweakDir, 'ccrouter');

    assert.equal(result, true);
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    assert.equal(config.settings.themes[0]?.id, 'dark');
    assert.equal(config.settings.themes[0]?.name, 'CCRouter Sky');
  } finally {
    cleanup(tweakDir);
  }
});

test('ensureTweakccConfig returns false if config exists and is up to date', () => {
  const tweakDir = makeTempDir();

  try {
    // First call creates the config
    ensureTweakccConfig(tweakDir, 'zai');

    // Second call should return false (no changes needed)
    const result = ensureTweakccConfig(tweakDir, 'zai');
    assert.equal(result, false);
  } finally {
    cleanup(tweakDir);
  }
});

test('ensureTweakccConfig updates config when themes differ', () => {
  const tweakDir = makeTempDir();
  const configPath = path.join(tweakDir, 'config.json');

  try {
    // Create initial config with different theme
    fs.writeFileSync(
      configPath,
      JSON.stringify({
        settings: {
          themes: [{ id: 'custom-theme', name: 'Custom Theme' }],
        },
      })
    );

    // Apply zai brand - should add brand theme to front
    const result = ensureTweakccConfig(tweakDir, 'zai');

    assert.equal(result, true);
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    // Brand theme should be first
    assert.equal(config.settings.themes[0]?.id, 'dark');
    assert.equal(config.settings.themes[0]?.name, 'Z.ai Carbon');
    // Custom theme should still be present
    assert.ok(config.settings.themes.some((t: { id?: string }) => t.id === 'custom-theme'));
  } finally {
    cleanup(tweakDir);
  }
});

test('ensureTweakccConfig handles malformed JSON gracefully', () => {
  const tweakDir = makeTempDir();
  const configPath = path.join(tweakDir, 'config.json');

  try {
    // Create malformed JSON
    fs.writeFileSync(configPath, '{ invalid json }');

    // Should not throw, just return false
    const result = ensureTweakccConfig(tweakDir, 'zai');
    assert.equal(result, false);
  } finally {
    cleanup(tweakDir);
  }
});

test('ensureTweakccConfig preserves user-managed toolsets', () => {
  const tweakDir = makeTempDir();
  const configPath = path.join(tweakDir, 'config.json');

  try {
    fs.writeFileSync(
      configPath,
      JSON.stringify({
        settings: {
          themes: [{ id: 'dark', name: 'Z.ai Carbon' }],
          toolsets: [{ name: 'review', allowedTools: ['Read', 'Grep'] }],
          defaultToolset: 'review',
          planModeToolset: 'review',
        },
      })
    );

    const result = ensureTweakccConfig(tweakDir, 'zai');

    assert.equal(result, true);
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    assert.deepEqual(config.settings.toolsets, [{ name: 'review', allowedTools: ['Read', 'Grep'] }]);
    assert.equal(config.settings.defaultToolset, 'review');
    assert.equal(config.settings.planModeToolset, 'review');
  } finally {
    cleanup(tweakDir);
  }
});

test('ensureTweakccConfig removes legacy minimax themes', () => {
  const tweakDir = makeTempDir();
  const configPath = path.join(tweakDir, 'config.json');

  try {
    // Create config with legacy minimax themes
    fs.writeFileSync(
      configPath,
      JSON.stringify({
        settings: {
          themes: [
            { id: 'minimax-pulse', name: 'MiniMax Pulse' },
            { id: 'minimax-ember', name: 'MiniMax Ember' },
            { id: 'minimax-glass', name: 'MiniMax Glass' },
            { id: 'minimax-blade', name: 'MiniMax Blade' },
          ],
        },
      })
    );

    const result = ensureTweakccConfig(tweakDir, 'minimax');

    assert.equal(result, true);
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    // Legacy themes should be removed
    assert.ok(!config.settings.themes.some((t: { id?: string }) => t.id === 'minimax-pulse'));
    assert.ok(!config.settings.themes.some((t: { id?: string }) => t.id === 'minimax-ember'));
    assert.ok(!config.settings.themes.some((t: { id?: string }) => t.id === 'minimax-glass'));
    assert.ok(!config.settings.themes.some((t: { id?: string }) => t.id === 'minimax-blade'));
    // Current brand theme should be present (now uses 'dark' id)
    assert.ok(config.settings.themes.some((t: { name?: string }) => t.name === 'MiniMax Nebula'));
  } finally {
    cleanup(tweakDir);
  }
});

test('ensureTweakccConfig updates userMessageDisplay when not set', () => {
  const tweakDir = makeTempDir();
  const configPath = path.join(tweakDir, 'config.json');

  try {
    // Create config without userMessageDisplay
    fs.writeFileSync(
      configPath,
      JSON.stringify({
        settings: {
          themes: [{ id: 'dark', name: 'Z.ai Carbon' }],
        },
      })
    );

    const result = ensureTweakccConfig(tweakDir, 'zai');

    assert.equal(result, true);
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    // Should have userMessageDisplay set
    assert.ok(config.settings.userMessageDisplay);
  } finally {
    cleanup(tweakDir);
  }
});

test('ensureTweakccConfig refreshes managed brand theme when content changes', () => {
  const tweakDir = makeTempDir();
  const configPath = path.join(tweakDir, 'config.json');

  try {
    const desiredTheme = buildBrandConfig('zai').settings.themes?.[0];
    assert.ok(desiredTheme);

    fs.writeFileSync(
      configPath,
      JSON.stringify({
        settings: {
          themes: [
            {
              id: desiredTheme.id,
              name: desiredTheme.name,
              colors: {
                ...desiredTheme.colors,
                diffAdded: 'rgb(255,255,255)',
              },
            },
          ],
        },
      })
    );

    const result = ensureTweakccConfig(tweakDir, 'zai');

    assert.equal(result, true);
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    assert.deepEqual(config.settings.themes[0], desiredTheme);
  } finally {
    cleanup(tweakDir);
  }
});

test('managed tweakcc patch list excludes toolsets and includes prompt pack IDs when enabled', () => {
  const baseIds = getManagedTweakccPatchIds('zai', { providerKey: 'zai', promptPackEnabled: false });
  assert.ok(baseIds.includes('agents-md'));
  assert.ok(baseIds.includes('allow-custom-agent-models'));
  assert.ok(!baseIds.includes('toolsets'));
  assert.ok(!baseIds.includes('model-customizations'));
  assert.ok(!baseIds.includes('system-prompt-main-system-prompt'));

  const promptPackIds = getManagedTweakccPatchIds('zai', { providerKey: 'zai', promptPackEnabled: true });
  assert.ok(promptPackIds.includes('system-prompt-main-system-prompt'));
  assert.ok(promptPackIds.includes('tool-description-websearch'));
  assert.ok(!promptPackIds.includes('toolsets'));

  const mirrorIds = getManagedTweakccPatchIds(null, { providerKey: 'mirror', promptPackEnabled: false });
  assert.ok(!mirrorIds.includes('model-customizations'));
  assert.ok(!mirrorIds.includes('opusplan1m'));
  assert.ok(mirrorIds.includes('show-more-items-in-select-menus'));
});
