/**
 * Tests for the tweakcc safety net: smoke test, pristine restore, rollback note.
 *
 * Covers helpers in src/core/tweakcc.ts and src/core/install.ts. The full
 * TweakccStep integration is exercised in
 * test/core/create-with-tweakcc-stub.test.ts (stubbed npx + real binary
 * download); we deliberately avoid network here.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import * as core from '../../src/core/index.js';
import { restorePristineBinary } from '../../src/core/install.js';
import { formatRollbackNote, smokeTestBinary, type SmokeTestResult } from '../../src/core/tweakcc.js';
import { cleanup, makeTempDir, writeExecutable } from '../helpers/index.js';

const isWindows = process.platform === 'win32';

const writeShellStub = (filePath: string, body: string) => {
  if (isWindows) {
    writeExecutable(filePath + '.cmd', body);
    return filePath + '.cmd';
  }
  writeExecutable(filePath, `#!/usr/bin/env bash\n${body}\n`);
  return filePath;
};

test('smokeTestBinary returns ok=true when binary exits 0', { skip: isWindows }, () => {
  const dir = makeTempDir();
  try {
    const stubPath = writeShellStub(path.join(dir, 'fake-claude'), 'echo "1.2.3 (Claude Code)"\nexit 0');
    const result = smokeTestBinary(stubPath, 3000);
    assert.equal(result.ok, true);
    assert.equal(result.status, 0);
    assert.equal(result.timedOut, false);
    assert.equal(result.signal, null);
    assert.match(result.stdout, /1\.2\.3/);
  } finally {
    cleanup(dir);
  }
});

test('smokeTestBinary returns ok=false on non-zero exit', { skip: isWindows }, () => {
  const dir = makeTempDir();
  try {
    const stubPath = writeShellStub(
      path.join(dir, 'fake-claude'),
      'echo "Expected CommonJS module to have a function wrapper" >&2\nexit 1'
    );
    const result = smokeTestBinary(stubPath, 3000);
    assert.equal(result.ok, false);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /CommonJS module/);
  } finally {
    cleanup(dir);
  }
});

test('smokeTestBinary returns ok=false on timeout', { skip: isWindows }, () => {
  const dir = makeTempDir();
  try {
    const stubPath = writeShellStub(path.join(dir, 'fake-claude'), 'sleep 5\nexit 0');
    const result = smokeTestBinary(stubPath, 200);
    assert.equal(result.ok, false);
    // Node sets either signal=SIGTERM or error.code=ETIMEDOUT depending on version;
    // both must be treated as failure.
    assert.ok(result.timedOut || result.signal !== null);
  } finally {
    cleanup(dir);
  }
});

test('smokeTestBinary returns ok=false when binary is missing', () => {
  const dir = makeTempDir();
  try {
    const result = smokeTestBinary(path.join(dir, 'does-not-exist'), 1000);
    assert.equal(result.ok, false);
  } finally {
    cleanup(dir);
  }
});

test('restorePristineBinary copies cache to target and chmod 0755', { skip: isWindows }, () => {
  const cacheDir = makeTempDir();
  const variantDir = makeTempDir();
  try {
    const version = '2.1.119';
    const platform = 'darwin-arm64';
    const cachePath = path.join(cacheDir, version, platform, 'claude');
    fs.mkdirSync(path.dirname(cachePath), { recursive: true });
    fs.writeFileSync(cachePath, 'PRISTINE_BINARY_BYTES', { mode: 0o644 });

    const binaryPath = path.join(variantDir, 'claude');
    // Pre-existing corrupt binary that should be replaced.
    fs.writeFileSync(binaryPath, 'CORRUPT_BYTES', { mode: 0o755 });

    const result = restorePristineBinary({
      binaryPath,
      cacheDir,
      resolvedVersion: version,
      platform,
    });

    assert.equal(result.restored, true);
    assert.equal(fs.readFileSync(binaryPath, 'utf8'), 'PRISTINE_BINARY_BYTES');
    const mode = fs.statSync(binaryPath).mode & 0o777;
    assert.equal(mode, 0o755);
  } finally {
    cleanup(cacheDir);
    cleanup(variantDir);
  }
});

test('restorePristineBinary returns cache-missing when cache file absent', () => {
  const cacheDir = makeTempDir();
  const variantDir = makeTempDir();
  try {
    const result = restorePristineBinary({
      binaryPath: path.join(variantDir, 'claude'),
      cacheDir,
      resolvedVersion: '9.9.9',
      platform: 'darwin-arm64',
    });
    assert.equal(result.restored, false);
    assert.equal(result.reason, 'cache-missing');
    assert.ok(result.cachePath?.includes('9.9.9'));
  } finally {
    cleanup(cacheDir);
    cleanup(variantDir);
  }
});

test('restorePristineBinary returns cache-missing on empty inputs', () => {
  const result = restorePristineBinary({
    binaryPath: '/tmp/x',
    cacheDir: '',
    resolvedVersion: '',
    platform: '',
  });
  assert.equal(result.restored, false);
  assert.equal(result.reason, 'cache-missing');
});

test('formatRollbackNote: smoke-failed with exit code', () => {
  const smoke: SmokeTestResult = {
    ok: false,
    status: 1,
    signal: null,
    stderr: 'Expected CommonJS module to have a function wrapper at /$bunfs/cli.js',
    stdout: '',
    timedOut: false,
  };
  const note = formatRollbackNote({ kind: 'smoke-failed', smoke });
  assert.match(note, /corrupted the binary/);
  assert.match(note, /exit 1/);
  assert.match(note, /CommonJS module/);
  assert.match(note, /restored pristine/);
  assert.match(note, /Brand theme \+ prompt overlays disabled/);
});

test('formatRollbackNote: smoke-failed with timeout', () => {
  const smoke: SmokeTestResult = {
    ok: false,
    status: null,
    signal: null,
    stderr: '',
    stdout: '',
    timedOut: true,
  };
  const note = formatRollbackNote({ kind: 'smoke-failed', smoke });
  assert.match(note, /binary hung/);
});

test('formatRollbackNote: smoke-failed with signal', () => {
  const smoke: SmokeTestResult = {
    ok: false,
    status: null,
    signal: 'SIGSEGV',
    stderr: '',
    stdout: '',
    timedOut: false,
  };
  const note = formatRollbackNote({ kind: 'smoke-failed', smoke });
  assert.match(note, /killed by SIGSEGV/);
});

test('formatRollbackNote: tweakcc-failed with output', () => {
  const note = formatRollbackNote({
    kind: 'tweakcc-failed',
    output: 'line one\nfailed to extract claude.js from native installation\nbye',
  });
  assert.match(note, /tweakcc failed/);
  assert.match(note, /failed to extract/);
});

test('formatRollbackNote: tweakcc-failed with empty output', () => {
  const note = formatRollbackNote({ kind: 'tweakcc-failed', output: '' });
  assert.match(note, /tweakcc failed \(no output\)/);
});

// --- Integration: createVariantAsync rollback when tweakcc stub fails ---
//
// Validates the full flow end-to-end: stubbed npx exits non-zero, TweakccStep
// rolls back to the pristine cached binary, theme resets to 'dark', notes
// surface the rollback, and meta.tweakRolledBack lands in variant.json. We
// piggyback on the same network-fetch pattern as create-with-tweakcc-stub.

test('createVariantAsync: tweakcc failure rolls back to pristine and continues', { skip: isWindows }, async () => {
  const rootDir = makeTempDir();
  const binDir = makeTempDir();
  const stubBin = makeTempDir();
  const prevPath = process.env.PATH;

  try {
    const stubNpx = path.join(stubBin, 'npx');
    // Exit non-zero with stderr that does NOT match isTweakccNativeExtractionFailure
    // so runTweakcc does not retry with @latest (keeps the test fast).
    fs.writeFileSync(stubNpx, '#!/usr/bin/env bash\necho "stub tweakcc: synthetic failure" >&2\nexit 7\n', {
      encoding: 'utf8',
      mode: 0o755,
    });
    process.env.PATH = `${stubBin}${path.delimiter}${prevPath || ''}`;

    const result = await core.createVariantAsync({
      name: 'tweakcc-rollback',
      providerKey: 'minimax',
      apiKey: '',
      claudeVersion: 'stable',
      rootDir,
      binDir,
      noTweak: false,
      promptPack: false,
      skillInstall: false,
      tweakccStdio: 'pipe',
    });

    // Rollback signaled in meta + notes; tweakResult preserved for debug.
    assert.equal(result.meta.tweakRolledBack, true, 'expected tweakRolledBack in meta');
    assert.ok(result.notes && result.notes.some((n) => /restored pristine/.test(n)), 'expected rollback note');
    assert.equal(result.tweakResult?.status, 7, 'tweakResult should preserve original exit code');

    // variant.json on disk should reflect the flag.
    const variantJson = JSON.parse(fs.readFileSync(path.join(rootDir, 'tweakcc-rollback', 'variant.json'), 'utf8'));
    assert.equal(variantJson.tweakRolledBack, true);

    // .claude.json themeId reset to 'dark' (built-in) since brand themes need a
    // patched binary that we don't have post-rollback.
    const claudeJson = JSON.parse(
      fs.readFileSync(path.join(rootDir, 'tweakcc-rollback', 'config', '.claude.json'), 'utf8')
    );
    assert.equal(claudeJson.theme, 'dark');

    // Wrapper still exists so the variant is usable.
    const wrapperPath = path.join(binDir, 'tweakcc-rollback');
    assert.ok(fs.existsSync(wrapperPath), `wrapper not written at ${wrapperPath}`);
  } finally {
    process.env.PATH = prevPath;
    cleanup(rootDir);
    cleanup(binDir);
    cleanup(stubBin);
  }
});
