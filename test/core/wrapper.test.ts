/**
 * Wrapper Script Generation Tests
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { writeWrapper, writeWindowsWrapper } from '../../src/core/wrapper.js';
import { getPlatform } from '../../src/core/platform.js';
import { makeTempDir, cleanup } from '../helpers/index.js';

const isWindows = getPlatform() === 'win32';
const platformWriteWrapper = isWindows ? writeWindowsWrapper : writeWrapper;

test('writeWrapper creates executable wrapper script', () => {
  const tempDir = makeTempDir();
  const configDir = path.join(tempDir, 'config');
  const wrapperPath = path.join(tempDir, 'wrapper');
  const binaryPath = isWindows ? 'C:\\path\\to\\binary' : '/path/to/binary';

  fs.mkdirSync(configDir, { recursive: true });

  try {
    platformWriteWrapper(wrapperPath, configDir, binaryPath);

    assert.ok(fs.existsSync(wrapperPath));

    const stats = fs.statSync(wrapperPath);
    if (!isWindows) {
      assert.ok((stats.mode & 0o111) !== 0, 'Wrapper should be executable');
    }
  } finally {
    cleanup(tempDir);
  }
});

test('writeWrapper creates script with correct header', () => {
  const tempDir = makeTempDir();
  const configDir = path.join(tempDir, 'config');
  const wrapperPath = path.join(tempDir, 'wrapper');
  const binaryPath = isWindows ? 'C:\\path\\to\\binary' : '/path/to/binary';

  fs.mkdirSync(configDir, { recursive: true });

  try {
    platformWriteWrapper(wrapperPath, configDir, binaryPath);

    const content = fs.readFileSync(wrapperPath, 'utf8');
    if (isWindows) {
      assert.ok(content.startsWith('@echo off'), 'Should start with @echo off');
    } else {
      assert.ok(content.startsWith('#!/usr/bin/env bash'), 'Should start with bash shebang');
    }
  } finally {
    cleanup(tempDir);
  }
});

test('writeWrapper sets CLAUDE_CONFIG_DIR', () => {
  const tempDir = makeTempDir();
  const configDir = path.join(tempDir, 'config');
  const wrapperPath = path.join(tempDir, 'wrapper');
  const binaryPath = isWindows ? 'C:\\path\\to\\binary' : '/path/to/binary';

  fs.mkdirSync(configDir, { recursive: true });

  try {
    platformWriteWrapper(wrapperPath, configDir, binaryPath);

    const content = fs.readFileSync(wrapperPath, 'utf8');
    assert.ok(content.includes('CLAUDE_CONFIG_DIR='), 'Should set CLAUDE_CONFIG_DIR');
    assert.ok(content.includes(configDir), 'Should include config dir path');
  } finally {
    cleanup(tempDir);
  }
});

test('writeWrapper sets TWEAKCC_CONFIG_DIR', () => {
  const tempDir = makeTempDir();
  const configDir = path.join(tempDir, 'config');
  const wrapperPath = path.join(tempDir, 'wrapper');
  const binaryPath = isWindows ? 'C:\\path\\to\\binary' : '/path/to/binary';

  fs.mkdirSync(configDir, { recursive: true });

  try {
    platformWriteWrapper(wrapperPath, configDir, binaryPath);

    const content = fs.readFileSync(wrapperPath, 'utf8');
    assert.ok(content.includes('TWEAKCC_CONFIG_DIR='), 'Should set TWEAKCC_CONFIG_DIR');
    const expectedTweakDir = path.join(tempDir, 'tweakcc');
    assert.ok(content.includes(expectedTweakDir), 'Should include tweakcc dir path');
  } finally {
    cleanup(tempDir);
  }
});

test('writeWrapper uses node runtime by default', () => {
  const tempDir = makeTempDir();
  const configDir = path.join(tempDir, 'config');
  const wrapperPath = path.join(tempDir, 'wrapper');
  const binaryPath = isWindows ? 'C:\\path\\to\\binary' : '/path/to/binary';

  fs.mkdirSync(configDir, { recursive: true });

  try {
    platformWriteWrapper(wrapperPath, configDir, binaryPath);

    const content = fs.readFileSync(wrapperPath, 'utf8');
    if (isWindows) {
      assert.ok(content.includes('node "'), 'Should use node runtime');
    } else {
      assert.ok(content.includes('exec node '), 'Should use node runtime');
    }
    assert.ok(content.includes(binaryPath), 'Should include binary path');
  } finally {
    cleanup(tempDir);
  }
});

test('writeWrapper uses native runtime when specified', () => {
  const tempDir = makeTempDir();
  const configDir = path.join(tempDir, 'config');
  const wrapperPath = path.join(tempDir, 'wrapper');
  const binaryPath = isWindows ? 'C:\\path\\to\\native-binary' : '/path/to/native-binary';

  fs.mkdirSync(configDir, { recursive: true });

  try {
    platformWriteWrapper(wrapperPath, configDir, binaryPath, 'native');

    const content = fs.readFileSync(wrapperPath, 'utf8');
    if (isWindows) {
      assert.ok(!content.includes('node "'), 'Native runtime should not use node');
      assert.ok(content.includes(binaryPath), 'Should include binary path');
    } else {
      const execLine = content.split('\n').find((line) => line.startsWith('exec'));
      assert.ok(execLine, 'Should have exec line');
      assert.ok(!execLine.includes('node'), 'Native runtime should not use node');
      assert.ok(execLine.includes(binaryPath), 'Should include binary path');
    }
  } finally {
    cleanup(tempDir);
  }
});

test('writeWrapper includes colored ASCII art for all providers', () => {
  const tempDir = makeTempDir();
  const configDir = path.join(tempDir, 'config');
  const wrapperPath = path.join(tempDir, 'wrapper');
  const binaryPath = isWindows ? 'C:\\path\\to\\binary' : '/path/to/binary';

  fs.mkdirSync(configDir, { recursive: true });

  try {
    platformWriteWrapper(wrapperPath, configDir, binaryPath);

    const content = fs.readFileSync(wrapperPath, 'utf8');

    if (isWindows) {
      assert.ok(content.includes('"zai"'), 'Should have zai case');
      assert.ok(content.includes('"minimax"'), 'Should have minimax case');
      assert.ok(content.includes('"openrouter"'), 'Should have openrouter case');
      assert.ok(content.includes('"ccrouter"'), 'Should have ccrouter case');
    } else {
      assert.ok(content.includes('zai)'), 'Should have zai case');
      assert.ok(content.includes('minimax)'), 'Should have minimax case');
      assert.ok(content.includes('openrouter)'), 'Should have openrouter case');
      assert.ok(content.includes('ccrouter)'), 'Should have ccrouter case');
    }

    assert.ok(content.includes('\x1b[38;5;'), 'Should include ANSI color codes');
    assert.ok(content.includes('\x1b[0m'), 'Should include color reset code');
  } finally {
    cleanup(tempDir);
  }
});

test('writeWrapper includes env loader', { skip: isWindows }, () => {
  const tempDir = makeTempDir();
  const configDir = path.join(tempDir, 'config');
  const wrapperPath = path.join(tempDir, 'wrapper');
  const binaryPath = '/path/to/binary';

  fs.mkdirSync(configDir, { recursive: true });

  try {
    writeWrapper(wrapperPath, configDir, binaryPath);

    const content = fs.readFileSync(wrapperPath, 'utf8');

    assert.ok(content.includes('settings.json'), 'Should reference settings.json');
    assert.ok(content.includes('__cc_mirror_env_file'), 'Should use temp env file');
    assert.ok(content.includes('source "$__cc_mirror_env_file"'), 'Should source env file');
  } finally {
    cleanup(tempDir);
  }
});

test('writeWrapper handles unset auth token option', () => {
  const tempDir = makeTempDir();
  const configDir = path.join(tempDir, 'config');
  const wrapperPath = path.join(tempDir, 'wrapper');
  const binaryPath = isWindows ? 'C:\\path\\to\\binary' : '/path/to/binary';

  fs.mkdirSync(configDir, { recursive: true });

  try {
    platformWriteWrapper(wrapperPath, configDir, binaryPath);

    const content = fs.readFileSync(wrapperPath, 'utf8');
    assert.ok(content.includes('CC_MIRROR_UNSET_AUTH_TOKEN'), 'Should check unset auth token option');
    if (isWindows) {
      assert.ok(content.includes('ANTHROPIC_AUTH_TOKEN='), 'Should clear auth token when requested');
    } else {
      assert.ok(content.includes('unset ANTHROPIC_AUTH_TOKEN'), 'Should unset auth token when requested');
    }
  } finally {
    cleanup(tempDir);
  }
});
