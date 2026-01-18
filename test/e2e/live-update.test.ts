/**
 * Live E2E test: create + update + headless run
 *
 * Run manually with:
 * CC_MIRROR_LIVE_E2E=1 ANTHROPIC_API_KEY=... npm test -- --test-name-pattern="Live E2E"
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import * as core from '../../src/core/index.js';
import { makeTempDir, cleanup } from '../helpers/index.js';

const apiKey = process.env.ANTHROPIC_API_KEY || process.env.Z_AI_API_KEY;
const shouldRun = process.env.CC_MIRROR_LIVE_E2E === '1' && !!apiKey && process.platform !== 'win32';

test('Live E2E: update keeps headless CLI working', { skip: !shouldRun, timeout: 120000 }, (t) => {
  const rootDir = makeTempDir();
  const binDir = makeTempDir();

  t.after(() => {
    cleanup(rootDir);
    cleanup(binDir);
  });

  const variantName = 'live-zai';

  core.createVariant({
    name: variantName,
    providerKey: 'zai',
    apiKey: apiKey as string,
    rootDir,
    binDir,
    brand: 'zai',
    promptPack: true,
    skillInstall: false,
    tweakccStdio: 'pipe',
  });

  core.updateVariant(rootDir, variantName, {
    binDir,
    tweakccStdio: 'pipe',
  });

  const wrapperPath = path.join(binDir, variantName);
  const result = spawnSync(wrapperPath, ['-p', 'hello'], {
    env: { ...process.env, CC_MIRROR_SPLASH: '0' },
    encoding: 'utf8',
  });

  assert.equal(result.status, 0, `headless CLI failed: ${result.stderr || result.stdout}`);
});
