import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { writeWrapperForPlatform } from '../../src/core/wrapper.js';
import { makeTempDir, cleanup } from '../helpers/index.js';

test('writeWrapperForPlatform creates bash script on darwin', () => {
  const tempDir = makeTempDir();
  const configDir = path.join(tempDir, 'config');
  const wrapperPath = path.join(tempDir, 'mclaude');
  const binaryPath = '/path/to/cli.js';

  fs.mkdirSync(configDir, { recursive: true });

  try {
    writeWrapperForPlatform(wrapperPath, configDir, binaryPath, 'node', 'darwin');
    const content = fs.readFileSync(wrapperPath, 'utf8');
    assert.ok(content.startsWith('#!/usr/bin/env bash'), 'Should create bash script on macOS');
  } finally {
    cleanup(tempDir);
  }
});

test('writeWrapperForPlatform creates bash script on linux', () => {
  const tempDir = makeTempDir();
  const configDir = path.join(tempDir, 'config');
  const wrapperPath = path.join(tempDir, 'mclaude');
  const binaryPath = '/path/to/cli.js';

  fs.mkdirSync(configDir, { recursive: true });

  try {
    writeWrapperForPlatform(wrapperPath, configDir, binaryPath, 'node', 'linux');
    const content = fs.readFileSync(wrapperPath, 'utf8');
    assert.ok(content.startsWith('#!/usr/bin/env bash'), 'Should create bash script on Linux');
  } finally {
    cleanup(tempDir);
  }
});

test('writeWrapperForPlatform creates cmd script on win32', () => {
  const tempDir = makeTempDir();
  const configDir = path.join(tempDir, 'config');
  const wrapperPath = path.join(tempDir, 'mclaude.cmd');
  const binaryPath = 'C:\\path\\to\\cli.js';

  fs.mkdirSync(configDir, { recursive: true });

  try {
    writeWrapperForPlatform(wrapperPath, configDir, binaryPath, 'node', 'win32');
    const content = fs.readFileSync(wrapperPath, 'utf8');
    assert.ok(content.startsWith('@echo off'), 'Should create cmd script on Windows');
  } finally {
    cleanup(tempDir);
  }
});

test('writeWrapperForPlatform uses current platform by default', () => {
  const tempDir = makeTempDir();
  const configDir = path.join(tempDir, 'config');
  const ext = process.platform === 'win32' ? '.cmd' : '';
  const wrapperPath = path.join(tempDir, `mclaude${ext}`);
  const binaryPath = process.platform === 'win32' ? 'C:\\path\\to\\cli.js' : '/path/to/cli.js';

  fs.mkdirSync(configDir, { recursive: true });

  try {
    writeWrapperForPlatform(wrapperPath, configDir, binaryPath, 'node');
    const content = fs.readFileSync(wrapperPath, 'utf8');

    if (process.platform === 'win32') {
      assert.ok(content.startsWith('@echo off'), 'Should create cmd script on Windows');
    } else {
      assert.ok(content.startsWith('#!/usr/bin/env bash'), 'Should create bash script on Unix');
    }
  } finally {
    cleanup(tempDir);
  }
});

test('writeWrapperForPlatform sets correct config dirs on all platforms', () => {
  const platforms = ['win32', 'darwin', 'linux'] as const;

  for (const platform of platforms) {
    const tempDir = makeTempDir();
    const configDir = path.join(tempDir, 'config');
    const ext = platform === 'win32' ? '.cmd' : '';
    const wrapperPath = path.join(tempDir, `mclaude${ext}`);
    const binaryPath = platform === 'win32' ? 'C:\\path\\to\\cli.js' : '/path/to/cli.js';

    fs.mkdirSync(configDir, { recursive: true });

    try {
      writeWrapperForPlatform(wrapperPath, configDir, binaryPath, 'node', platform);
      const content = fs.readFileSync(wrapperPath, 'utf8');
      assert.ok(content.includes('CLAUDE_CONFIG_DIR'), `Should set CLAUDE_CONFIG_DIR on ${platform}`);
      assert.ok(content.includes('TWEAKCC_CONFIG_DIR'), `Should set TWEAKCC_CONFIG_DIR on ${platform}`);
    } finally {
      cleanup(tempDir);
    }
  }
});
