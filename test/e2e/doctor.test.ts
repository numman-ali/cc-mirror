/**
 * E2E Tests - Doctor Command
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import * as core from '../../src/core/index.js';
import { makeTempDir, cleanup } from '../helpers/index.js';

test('E2E: Doctor command', async (t) => {
  const createdDirs: string[] = [];

  t.after(() => {
    for (const dir of createdDirs) {
      cleanup(dir);
    }
  });

  await t.test('doctor reports healthy variants', () => {
    const rootDir = makeTempDir();
    const binDir = makeTempDir();
    createdDirs.push(rootDir, binDir);

    // Create multiple variants
    for (const provider of ['zai', 'minimax']) {
      core.createVariant({
        name: `doctor-${provider}`,
        providerKey: provider,
        apiKey: 'test-key',
        rootDir,
        binDir,
        brand: provider,
        promptPack: false,
        skillInstall: false,
        noTweak: true,
        tweakccStdio: 'pipe',
      });
    }

    // Run doctor
    const report = core.doctor(rootDir, binDir);

    assert.equal(report.length, 2, 'Doctor should report 2 variants');
    for (const entry of report) {
      assert.ok(entry.ok, `Variant ${entry.name} should be healthy`);
    }
  });
});
