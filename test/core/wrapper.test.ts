/**
 * Wrapper Script Generation Tests
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { writeWrapper } from '../../src/core/wrapper.js';
import { getWrapperPath, getWrapperScriptPath } from '../../src/core/paths.js';
import { makeTempDir, cleanup } from '../helpers/index.js';

const isWindows = process.platform === 'win32';

const getWrapperFiles = (dir: string, name: string) => {
  return {
    wrapperPath: getWrapperPath(dir, name),
    scriptPath: getWrapperScriptPath(dir, name),
  };
};

test('writeWrapper creates executable wrapper script', () => {
  const tempDir = makeTempDir();
  const configDir = path.join(tempDir, 'config');
  const { wrapperPath, scriptPath } = getWrapperFiles(tempDir, 'wrapper');
  const binaryPath = '/path/to/binary';

  fs.mkdirSync(configDir, { recursive: true });

  try {
    writeWrapper(wrapperPath, configDir, binaryPath);

    assert.ok(fs.existsSync(wrapperPath));
    if (isWindows) {
      assert.ok(fs.existsSync(scriptPath), 'Windows wrapper should include .mjs script');
      return;
    }

    const stats = fs.statSync(wrapperPath);
    // Check executable bit
    assert.ok((stats.mode & 0o111) !== 0, 'Wrapper should be executable');
  } finally {
    cleanup(tempDir);
  }
});

test('writeWrapper creates script with shebang', () => {
  const tempDir = makeTempDir();
  const configDir = path.join(tempDir, 'config');
  const { wrapperPath, scriptPath } = getWrapperFiles(tempDir, 'wrapper');
  const binaryPath = '/path/to/binary';

  fs.mkdirSync(configDir, { recursive: true });

  try {
    writeWrapper(wrapperPath, configDir, binaryPath);

    const content = fs.readFileSync(wrapperPath, 'utf8');
    if (isWindows) {
      const scriptFilename = path.basename(scriptPath);
      assert.ok(content.startsWith('@echo off'), 'Windows launcher should start with @echo off');
      assert.ok(content.includes('%~dp0'), 'Windows launcher should resolve script path from its directory');
      assert.ok(
        content.includes(`node "%~dp0${scriptFilename}" %*`),
        'Windows launcher should invoke node with the script path'
      );
      assert.ok(fs.existsSync(scriptPath), 'Windows wrapper should include .mjs script');
      return;
    }
    assert.ok(content.startsWith('#!/usr/bin/env bash'), 'Should start with bash shebang');
  } finally {
    cleanup(tempDir);
  }
});

test('writeWrapper sets CLAUDE_CONFIG_DIR', () => {
  const tempDir = makeTempDir();
  const configDir = path.join(tempDir, 'config');
  const { wrapperPath, scriptPath } = getWrapperFiles(tempDir, 'wrapper');
  const binaryPath = '/path/to/binary';

  fs.mkdirSync(configDir, { recursive: true });

  try {
    writeWrapper(wrapperPath, configDir, binaryPath);

    const content = fs.readFileSync(isWindows ? scriptPath : wrapperPath, 'utf8');
    if (isWindows) {
      assert.ok(content.includes('process.env.CLAUDE_CONFIG_DIR'), 'Should set CLAUDE_CONFIG_DIR');
      assert.ok(content.includes(JSON.stringify(configDir)), 'Should include config dir path');
    } else {
      assert.ok(content.includes('CLAUDE_CONFIG_DIR='), 'Should set CLAUDE_CONFIG_DIR');
      assert.ok(content.includes(configDir), 'Should include config dir path');
    }
  } finally {
    cleanup(tempDir);
  }
});

test('writeWrapper sets TWEAKCC_CONFIG_DIR', () => {
  const tempDir = makeTempDir();
  const configDir = path.join(tempDir, 'config');
  const { wrapperPath, scriptPath } = getWrapperFiles(tempDir, 'wrapper');
  const binaryPath = '/path/to/binary';

  fs.mkdirSync(configDir, { recursive: true });

  try {
    writeWrapper(wrapperPath, configDir, binaryPath);

    const content = fs.readFileSync(isWindows ? scriptPath : wrapperPath, 'utf8');
    if (isWindows) {
      assert.ok(content.includes('process.env.TWEAKCC_CONFIG_DIR'), 'Should set TWEAKCC_CONFIG_DIR');
    } else {
      assert.ok(content.includes('TWEAKCC_CONFIG_DIR='), 'Should set TWEAKCC_CONFIG_DIR');
    }
    // tweakDir is derived from configDir's parent + /tweakcc
    const expectedTweakDir = path.join(tempDir, 'tweakcc');
    if (isWindows) {
      assert.ok(content.includes(JSON.stringify(expectedTweakDir)), 'Should include tweakcc dir path');
    } else {
      assert.ok(content.includes(expectedTweakDir), 'Should include tweakcc dir path');
    }
  } finally {
    cleanup(tempDir);
  }
});

test('writeWrapper uses node runtime by default', () => {
  const tempDir = makeTempDir();
  const configDir = path.join(tempDir, 'config');
  const { wrapperPath, scriptPath } = getWrapperFiles(tempDir, 'wrapper');
  const binaryPath = '/path/to/binary';

  fs.mkdirSync(configDir, { recursive: true });

  try {
    writeWrapper(wrapperPath, configDir, binaryPath);

    const content = fs.readFileSync(isWindows ? scriptPath : wrapperPath, 'utf8');
    if (isWindows) {
      assert.ok(content.includes('const runtime = "node"'), 'Should default to node runtime');
      assert.ok(content.includes(binaryPath), 'Should include binary path');
      return;
    }
    assert.ok(content.includes('exec node '), 'Should use node runtime');
    assert.ok(content.includes(binaryPath), 'Should include binary path');
  } finally {
    cleanup(tempDir);
  }
});

test('writeWrapper uses native runtime when specified', () => {
  const tempDir = makeTempDir();
  const configDir = path.join(tempDir, 'config');
  const { wrapperPath, scriptPath } = getWrapperFiles(tempDir, 'wrapper');
  const binaryPath = '/path/to/native-binary';

  fs.mkdirSync(configDir, { recursive: true });

  try {
    writeWrapper(wrapperPath, configDir, binaryPath, 'native');

    const content = fs.readFileSync(isWindows ? scriptPath : wrapperPath, 'utf8');
    if (isWindows) {
      assert.ok(content.includes('const runtime = "native"'), 'Should set native runtime');
      assert.ok(content.includes(binaryPath), 'Should include binary path');
      return;
    }
    // Native runtime should not have 'exec node'
    const execLine = content.split('\n').find((line) => line.startsWith('exec'));
    assert.ok(execLine, 'Should have exec line');
    assert.ok(!execLine.includes('node'), 'Native runtime should not use node');
    assert.ok(execLine.includes(binaryPath), 'Should include binary path');
  } finally {
    cleanup(tempDir);
  }
});

test('writeWrapper includes colored ASCII art for all providers', () => {
  const tempDir = makeTempDir();
  const configDir = path.join(tempDir, 'config');
  const { wrapperPath, scriptPath } = getWrapperFiles(tempDir, 'wrapper');
  const binaryPath = '/path/to/binary';

  fs.mkdirSync(configDir, { recursive: true });

  try {
    writeWrapper(wrapperPath, configDir, binaryPath);

    const content = fs.readFileSync(isWindows ? scriptPath : wrapperPath, 'utf8');

    // Check for provider case statements
    if (isWindows) {
      assert.ok(content.includes('"zai"'), 'Should include zai art');
      assert.ok(content.includes('"minimax"'), 'Should include minimax art');
      assert.ok(content.includes('"openrouter"'), 'Should include openrouter art');
      assert.ok(content.includes('"ccrouter"'), 'Should include ccrouter art');
    } else {
      assert.ok(content.includes('zai)'), 'Should have zai case');
      assert.ok(content.includes('minimax)'), 'Should have minimax case');
      assert.ok(content.includes('openrouter)'), 'Should have openrouter case');
      assert.ok(content.includes('ccrouter)'), 'Should have ccrouter case');
    }

    // Check for ANSI color codes
    if (isWindows) {
      assert.ok(content.includes('\\u001b[38;5;'), 'Should include ANSI color codes');
      assert.ok(content.includes('\\u001b[0m'), 'Should include color reset code');
    } else {
      assert.ok(content.includes('\x1b[38;5;'), 'Should include ANSI color codes');
      assert.ok(content.includes('\x1b[0m'), 'Should include color reset code');
    }
  } finally {
    cleanup(tempDir);
  }
});

test('writeWrapper includes env loader', () => {
  const tempDir = makeTempDir();
  const configDir = path.join(tempDir, 'config');
  const { wrapperPath, scriptPath } = getWrapperFiles(tempDir, 'wrapper');
  const binaryPath = '/path/to/binary';

  fs.mkdirSync(configDir, { recursive: true });

  try {
    writeWrapper(wrapperPath, configDir, binaryPath);

    const content = fs.readFileSync(isWindows ? scriptPath : wrapperPath, 'utf8');

    // Check for env loader logic
    assert.ok(content.includes('settings.json'), 'Should reference settings.json');
    if (isWindows) {
      assert.ok(content.includes('process.env[key]'), 'Should assign env vars from settings');
    } else {
      assert.ok(content.includes('__claude_sneakpeek_env_file'), 'Should use temp env file');
      assert.ok(content.includes('source "$__claude_sneakpeek_env_file"'), 'Should source env file');
    }
  } finally {
    cleanup(tempDir);
  }
});

test('writeWrapper handles unset auth token option', () => {
  const tempDir = makeTempDir();
  const configDir = path.join(tempDir, 'config');
  const { wrapperPath, scriptPath } = getWrapperFiles(tempDir, 'wrapper');
  const binaryPath = '/path/to/binary';

  fs.mkdirSync(configDir, { recursive: true });

  try {
    writeWrapper(wrapperPath, configDir, binaryPath);

    const content = fs.readFileSync(isWindows ? scriptPath : wrapperPath, 'utf8');
    assert.ok(content.includes('CLAUDE_SNEAKPEEK_UNSET_AUTH_TOKEN'), 'Should check unset auth token option');
    if (isWindows) {
      assert.ok(content.includes('delete process.env.ANTHROPIC_AUTH_TOKEN'), 'Should unset auth token when requested');
    } else {
      assert.ok(content.includes('unset ANTHROPIC_AUTH_TOKEN'), 'Should unset auth token when requested');
    }
  } finally {
    cleanup(tempDir);
  }
});
