import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPoeTweakccConfig, POE_BLOCKED_TOOLS } from '../../../src/brands/poe.js';

test('Poe brand configuration', async (t) => {
  await t.test('buildPoeTweakccConfig returns valid config', () => {
    const config = buildPoeTweakccConfig();
    assert.ok(config.settings, 'config should have settings');
    assert.ok(config.settings.themes, 'config should have themes');
    assert.ok(config.settings.themes.length > 0, 'should have at least one theme');
    assert.equal(config.settings.themes[0].id, 'poe-violet');
    assert.equal(config.settings.themes[0].name, 'Poe Violet');
  });

  await t.test('POE_BLOCKED_TOOLS is empty array', () => {
    assert.ok(Array.isArray(POE_BLOCKED_TOOLS));
    assert.equal(POE_BLOCKED_TOOLS.length, 0, 'Poe should not block any tools');
  });

  await t.test('config has poe toolset', () => {
    const config = buildPoeTweakccConfig();
    const toolsets = config.settings.toolsets;
    assert.ok(
      toolsets.some((t) => t.name === 'poe'),
      'should have poe toolset'
    );
  });
});
