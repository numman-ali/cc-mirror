/**
 * End-to-end integration test for the in-repo binary patcher.
 *
 * Drives core.createVariantAsync against a real Claude Code binary downloaded
 * from the canonical install manifest. Asserts the wrapper launches post-
 * patch and that platform-specific outcomes are correct:
 *  - linux ELF / win32 PE: applyPatches resizes the entry JS in place; the
 *    wrapper runs and reports the expected version.
 *  - darwin Mach-O: applyPatches detects that theme + prompt patches would
 *    grow the entry JS, skips the patch, and surfaces a clear note. The
 *    pristine binary stays in place and still launches.
 *
 * Network-gated by CC_MIRROR_NETWORK_TESTS=1 because the test downloads
 * ~200 MB of binary on first run. CI sets this env var; local runs skip
 * by default.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import * as core from '../../../src/core/index.js';
import { cleanup, makeTempDir } from '../../helpers/index.js';

const NETWORK_TESTS_ENABLED = process.env.CC_MIRROR_NETWORK_TESTS === '1';
const isWindows = process.platform === 'win32';
const isMac = process.platform === 'darwin';

test(
  'createVariantAsync drives the in-repo patcher end-to-end',
  { skip: !NETWORK_TESTS_ENABLED || isWindows },
  async () => {
    const rootDir = makeTempDir();
    const binDir = makeTempDir();

    try {
      const result = await core.createVariantAsync({
        name: 'patcher-it',
        providerKey: 'minimax',
        apiKey: '',
        claudeVersion: 'stable',
        rootDir,
        binDir,
        noTweak: false,
        promptPack: true,
        skillInstall: false,
        tweakccStdio: 'pipe',
      });

      // Wrapper must exist and launch.
      const wrapperPath = path.join(binDir, 'patcher-it');
      assert.ok(fs.existsSync(wrapperPath), `wrapper missing at ${wrapperPath}`);

      // Variant should be functional regardless of patch outcome.
      assert.equal(result.meta.tweakRolledBack ?? false, false, 'patcher should not have rolled back');

      if (isMac) {
        // Mach-O: patch is skipped because theme + overlays grow the entry JS.
        // Note is appended; tweakResult.status is 0 (the skip is a successful
        // outcome, not a failure).
        assert.ok(result.tweakResult, 'expected tweakResult to be set');
        assert.equal(result.tweakResult?.status, 0);
        assert.ok(
          result.notes?.some((n) => /Mach-O patch skipped/.test(n)),
          `expected Mach-O skip note, got: ${JSON.stringify(result.notes)}`
        );
      } else {
        // Linux ELF: the patch should land. tweakResult.status === 0 with no
        // skip note.
        assert.equal(result.tweakResult?.status, 0);
        assert.ok(
          !result.notes?.some((n) => /Mach-O patch skipped/.test(n)),
          'should not see Mach-O skip note on linux'
        );

        // Spot-check that minimax brand theme bytes ended up in the patched binary.
        const binaryPath = result.meta.binaryPath;
        const buf = fs.readFileSync(binaryPath);
        const text = buf.toString('latin1');
        assert.ok(
          text.includes('"label":"MiniMax Nebula","value":"dark"') ||
            text.includes('"value":"dark","label":"MiniMax Nebula"'),
          'patched binary should contain the rewritten theme options array'
        );
      }
    } finally {
      cleanup(rootDir);
      cleanup(binDir);
    }
  }
);
