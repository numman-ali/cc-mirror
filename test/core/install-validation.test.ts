import test from 'node:test';
import assert from 'node:assert/strict';
import { installNpmClaude, installNpmClaudeAsync } from '../../src/core/install.js';
import { makeTempDir, cleanup } from '../helpers/index.js';

test('installNpmClaude rejects invalid npm package', () => {
  const tempDir = makeTempDir();
  try {
    assert.throws(
      () =>
        installNpmClaude({
          npmDir: tempDir,
          npmPackage: 'bad&pkg',
          npmVersion: '2.1.1',
          stdio: 'pipe',
        }),
      /Invalid npm package/
    );
  } finally {
    cleanup(tempDir);
  }
});

test('installNpmClaude rejects invalid npm version', () => {
  const tempDir = makeTempDir();
  try {
    assert.throws(
      () =>
        installNpmClaude({
          npmDir: tempDir,
          npmPackage: '@anthropic-ai/claude-code',
          npmVersion: '1.0.0 & calc',
          stdio: 'pipe',
        }),
      /Invalid npm version/
    );
  } finally {
    cleanup(tempDir);
  }
});

test('installNpmClaudeAsync rejects invalid npm package', async () => {
  const tempDir = makeTempDir();
  try {
    await assert.rejects(
      installNpmClaudeAsync({
        npmDir: tempDir,
        npmPackage: 'bad/pkg',
        npmVersion: '2.1.1',
        stdio: 'pipe',
      }),
      /Invalid npm package/
    );
  } finally {
    cleanup(tempDir);
  }
});
