import test from 'node:test';
import assert from 'node:assert/strict';
import { listBrandPresets, buildBrandConfig } from '../../src/brands/index.js';

const parseRgb = (value: string): [number, number, number] | null => {
  const match = value.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/i);
  if (!match) return null;
  return [Number(match[1]), Number(match[2]), Number(match[3])];
};

const luminance = ([r, g, b]: [number, number, number]): number => {
  const lin = (c: number) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
};

test('all managed brand themes default to dark backgrounds', () => {
  const presets = listBrandPresets();
  assert.ok(presets.length > 0);

  for (const preset of presets) {
    const cfg = buildBrandConfig(preset.key);
    const bg = cfg.settings.themes?.[0]?.colors?.background;
    assert.ok(typeof bg === 'string' && bg.length > 0, `missing background for brand ${preset.key}`);
    const parsed = parseRgb(bg);
    assert.ok(parsed, `background must be rgb(...) for brand ${preset.key}`);
    // Keep brand defaults in dark mode to avoid low-contrast diffs in terminals.
    assert.ok(luminance(parsed) < 0.2, `brand ${preset.key} background should be dark, got ${bg}`);
  }
});
