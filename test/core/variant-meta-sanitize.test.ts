/**
 * Variant metadata sanitation tests
 *
 * Ensures update rewrites variant.json without legacy fields from older cc-mirror versions.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import * as core from '../../src/core/index.js';
import { makeTempDir, cleanup, readFile } from '../helpers/index.js';

test('update rewrites variant.json to native-only schema (drops legacy npm fields)', async () => {
  const rootDir = makeTempDir('cc-mirror-meta-root-');
  const binDir = makeTempDir('cc-mirror-meta-bin-');

  try {
    const name = 'alpha';
    const variantDir = path.join(rootDir, name);
    const configDir = path.join(variantDir, 'config');
    const tweakDir = path.join(variantDir, 'tweakcc');
    const nativeDir = path.join(variantDir, 'native');
    fs.mkdirSync(configDir, { recursive: true });
    fs.writeFileSync(path.join(configDir, 'settings.json'), JSON.stringify({ env: {} }, null, 2));

    // Simulate a legacy variant.json that still contains npm-era metadata.
    const legacyMeta = {
      name,
      provider: 'zai',
      createdAt: new Date().toISOString(),
      claudeOrig: 'native:2.1.25',
      binaryPath: path.join(nativeDir, process.platform === 'win32' ? 'claude.exe' : 'claude'),
      configDir,
      tweakDir,
      binDir,
      nativeDir,
      nativeVersion: 'latest',
      nativeVersionSource: 'default',
      installType: 'npm',
      npmDir: path.join(variantDir, 'npm'),
      npmPackage: '@anthropic-ai/claude-code',
      npmVersion: '2.1.5',
      teamModeEnabled: true,
      promptPackMode: 'minimal',
    };

    fs.mkdirSync(variantDir, { recursive: true });
    fs.writeFileSync(path.join(variantDir, 'variant.json'), JSON.stringify(legacyMeta, null, 2));

    await core.updateVariantAsync(rootDir, name, {
      binDir,
      noTweak: true,
      settingsOnly: true,
      tweakccStdio: 'pipe',
    });

    const updated = JSON.parse(readFile(path.join(variantDir, 'variant.json'))) as Record<string, unknown>;

    // Required fields remain.
    assert.equal(updated.name, name);
    assert.equal(updated.provider, 'zai');
    assert.ok(typeof updated.createdAt === 'string' && updated.createdAt.length > 0);
    assert.ok(typeof updated.updatedAt === 'string' && updated.updatedAt.length > 0);
    assert.ok(typeof updated.binaryPath === 'string' && updated.binaryPath.length > 0);
    assert.ok(typeof updated.configDir === 'string' && updated.configDir.length > 0);
    assert.ok(typeof updated.tweakDir === 'string' && updated.tweakDir.length > 0);
    assert.ok(typeof updated.binDir === 'string' && updated.binDir.length > 0);
    assert.ok(typeof updated.nativeDir === 'string' && updated.nativeDir.length > 0);

    // Legacy fields are removed.
    for (const key of ['installType', 'npmDir', 'npmPackage', 'npmVersion', 'teamModeEnabled', 'promptPackMode']) {
      assert.ok(!Object.hasOwn(updated, key), `${key} should be removed`);
    }
  } finally {
    cleanup(rootDir);
    cleanup(binDir);
  }
});
