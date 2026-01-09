/**
 * Windows wrapper execution smoke test
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import * as core from '../../src/core/index.js';
import { getWrapperPath } from '../../src/core/paths.js';
import { makeTempDir, cleanup } from '../helpers/index.js';

test('windows wrapper executes CLI', { skip: process.platform !== 'win32' }, () => {
  const rootDir = makeTempDir();
  const binDir = makeTempDir();

  try {
    const result = core.createVariant({
      name: 'win-smoke',
      providerKey: 'custom',
      baseUrl: 'http://localhost:4000/anthropic',
      apiKey: '',
      rootDir,
      binDir,
      noTweak: true,
      promptPack: false,
      skillInstall: false,
      tweakccStdio: 'pipe',
    });

    const wrapperPath = getWrapperPath(binDir, result.meta.name);
    const exec = spawnSync(wrapperPath, ['--version'], {
      encoding: 'utf8',
      shell: true,
      env: { ...process.env, CC_MIRROR_SPLASH: '0' },
    });

    assert.equal(exec.status, 0);
    const output = `${exec.stdout ?? ''}${exec.stderr ?? ''}`;
    assert.match(output, /\d+\.\d+\.\d+/, 'Expected --version output to include a semver');
  } finally {
    cleanup(rootDir);
    cleanup(binDir);
  }
});
