import test from 'node:test';
import assert from 'node:assert/strict';
import { getBrandPreset, listBrandPresets, resolveBrandKey } from '../../../src/brands/index.js';

test('Brand index includes poe', async (t) => {
  await t.test('getBrandPreset returns poe preset', () => {
    const preset = getBrandPreset('poe');
    assert.ok(preset, 'poe preset should exist');
    assert.equal(preset.key, 'poe');
    assert.equal(preset.label, 'Poe Violet');
  });

  await t.test('listBrandPresets includes poe', () => {
    const presets = listBrandPresets();
    const poe = presets.find((p) => p.key === 'poe');
    assert.ok(poe, 'poe should be in preset list');
  });

  await t.test('resolveBrandKey auto-resolves poe', () => {
    const key = resolveBrandKey('poe', 'auto');
    assert.equal(key, 'poe');
  });
});
