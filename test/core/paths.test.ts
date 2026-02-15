import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import { cleanup, makeTempDir } from '../helpers/index.js';
import { detectCommandCollision, getWrapperPath, resolveCommandPath } from '../../src/core/paths.js';

test('resolveCommandPath returns null for unknown command', () => {
  const resolved = resolveCommandPath('cc_mirror_command_that_should_not_exist_12345');
  assert.equal(resolved, null);
});

test('detectCommandCollision reports wrapper collisions', () => {
  const binDir = makeTempDir();
  try {
    const wrapperPath = getWrapperPath(binDir, 'samplecmd');
    fs.writeFileSync(wrapperPath, '#!/usr/bin/env bash\necho hello\n');
    const result = detectCommandCollision('samplecmd', binDir);
    assert.equal(result.wrapperExists, true);
    assert.equal(result.hasCollision, true);
  } finally {
    cleanup(binDir);
  }
});

test('detectCommandCollision reports path conflicts for existing system commands', () => {
  const resolvedNode = resolveCommandPath('node');
  if (!resolvedNode) return;

  const binDir = makeTempDir();
  try {
    const result = detectCommandCollision('node', binDir);
    assert.equal(result.binDirOnPath, false);
    assert.equal(result.pathConflicts, false);
    assert.equal(result.hasCollision, false);
  } finally {
    cleanup(binDir);
  }
});

test('detectCommandCollision marks path conflict when bin dir is on PATH', () => {
  const resolvedNode = resolveCommandPath('node');
  if (!resolvedNode) return;

  const binDir = makeTempDir();
  const previousPath = process.env.PATH;
  try {
    process.env.PATH = `${binDir}${process.platform === 'win32' ? ';' : ':'}${previousPath || ''}`;
    const result = detectCommandCollision('node', binDir);
    assert.equal(result.binDirOnPath, true);
    assert.equal(result.pathConflicts, true);
    assert.equal(result.hasCollision, true);
  } finally {
    process.env.PATH = previousPath;
    cleanup(binDir);
  }
});
