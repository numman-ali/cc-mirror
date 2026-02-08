import test from 'node:test';
import assert from 'node:assert/strict';
import { installNativeClaudeAsync } from '../../src/core/install.js';
import { makeTempDir, cleanup } from '../helpers/index.js';

test('installNativeClaudeAsync rejects invalid version spec', async () => {
  const nativeDir = makeTempDir();
  try {
    await assert.rejects(
      installNativeClaudeAsync({
        nativeDir,
        version: '2.1.25 && rm -rf /',
        stdio: 'pipe',
      }),
      /Invalid Claude Code version/
    );
  } finally {
    cleanup(nativeDir);
  }
});

test('installNativeClaudeAsync rejects empty version spec', async () => {
  const nativeDir = makeTempDir();
  try {
    await assert.rejects(
      installNativeClaudeAsync({
        nativeDir,
        version: '',
        stdio: 'pipe',
      }),
      /Invalid Claude Code version/
    );
  } finally {
    cleanup(nativeDir);
  }
});
