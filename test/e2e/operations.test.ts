/**
 * E2E Tests - Variant Operations (Update, Remove, List)
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import * as core from '../../src/core/index.js';
import { makeTempDir, cleanup } from '../helpers/index.js';
import { PROVIDERS } from './providers.js';

test('E2E: Update and remove variants', async (t) => {
  const createdDirs: string[] = [];

  t.after(() => {
    for (const dir of createdDirs) {
      cleanup(dir);
    }
  });

  await t.test('can update a variant', () => {
    const rootDir = makeTempDir();
    const binDir = makeTempDir();
    createdDirs.push(rootDir, binDir);

    // Create variant
    core.createVariant({
      name: 'update-test',
      providerKey: 'zai',
      apiKey: 'test-key',
      rootDir,
      binDir,
      brand: 'zai',
      promptPack: false,
      skillInstall: false,
      noTweak: true,
      tweakccStdio: 'pipe',
    });

    // Update variant
    const updateResult = core.updateVariant(rootDir, 'update-test', {
      noTweak: true,
      tweakccStdio: 'pipe',
      binDir,
    });

    assert.ok(updateResult.meta, 'Update should return meta');
    assert.equal(updateResult.meta.name, 'update-test');

    // Verify variant still exists
    const variantDir = path.join(rootDir, 'update-test');
    assert.ok(fs.existsSync(variantDir), 'Variant should still exist after update');
  });

  await t.test('can remove a variant', () => {
    const rootDir = makeTempDir();
    const binDir = makeTempDir();
    createdDirs.push(rootDir, binDir);

    // Create variant
    core.createVariant({
      name: 'remove-test',
      providerKey: 'minimax',
      apiKey: 'test-key',
      rootDir,
      binDir,
      brand: 'minimax',
      promptPack: false,
      skillInstall: false,
      noTweak: true,
      tweakccStdio: 'pipe',
    });

    const variantDir = path.join(rootDir, 'remove-test');
    assert.ok(fs.existsSync(variantDir), 'Variant should exist before removal');

    // Remove variant
    core.removeVariant(rootDir, 'remove-test');

    assert.ok(!fs.existsSync(variantDir), 'Variant should not exist after removal');
  });
});

test('E2E: List variants', async (t) => {
  const createdDirs: string[] = [];

  t.after(() => {
    for (const dir of createdDirs) {
      cleanup(dir);
    }
  });

  await t.test('lists all created variants', () => {
    const rootDir = makeTempDir();
    const binDir = makeTempDir();
    createdDirs.push(rootDir, binDir);

    // Create variants for all providers
    for (const provider of PROVIDERS) {
      core.createVariant({
        name: `list-${provider.key}`,
        providerKey: provider.key,
        apiKey: provider.apiKey,
        rootDir,
        binDir,
        brand: provider.key,
        promptPack: false,
        skillInstall: false,
        noTweak: true,
        tweakccStdio: 'pipe',
      });
    }

    const variants = core.listVariants(rootDir);

    assert.equal(variants.length, PROVIDERS.length, `Should list ${PROVIDERS.length} variants`);

    const variantNames = variants.map((v) => v.name);
    for (const provider of PROVIDERS) {
      assert.ok(variantNames.includes(`list-${provider.key}`), `Should include list-${provider.key}`);
    }
  });
});
