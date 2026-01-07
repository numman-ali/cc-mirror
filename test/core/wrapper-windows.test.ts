import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { writeWindowsWrapper } from '../../src/core/wrapper.js';
import { makeTempDir, cleanup } from '../helpers/index.js';

test('writeWindowsWrapper creates .cmd file', () => {
  const tempDir = makeTempDir();
  const configDir = path.join(tempDir, 'config');
  const wrapperPath = path.join(tempDir, 'mclaude.cmd');
  const binaryPath = 'C:\\path\\to\\cli.js';

  fs.mkdirSync(configDir, { recursive: true });

  try {
    writeWindowsWrapper(wrapperPath, configDir, binaryPath);
    assert.ok(fs.existsSync(wrapperPath), 'Wrapper file should exist');
  } finally {
    cleanup(tempDir);
  }
});

test('writeWindowsWrapper starts with @echo off', () => {
  const tempDir = makeTempDir();
  const configDir = path.join(tempDir, 'config');
  const wrapperPath = path.join(tempDir, 'mclaude.cmd');
  const binaryPath = 'C:\\path\\to\\cli.js';

  fs.mkdirSync(configDir, { recursive: true });

  try {
    writeWindowsWrapper(wrapperPath, configDir, binaryPath);
    const content = fs.readFileSync(wrapperPath, 'utf8');
    assert.ok(content.startsWith('@echo off'), 'Should start with @echo off');
  } finally {
    cleanup(tempDir);
  }
});

test('writeWindowsWrapper sets CLAUDE_CONFIG_DIR', () => {
  const tempDir = makeTempDir();
  const configDir = path.join(tempDir, 'config');
  const wrapperPath = path.join(tempDir, 'mclaude.cmd');
  const binaryPath = 'C:\\path\\to\\cli.js';

  fs.mkdirSync(configDir, { recursive: true });

  try {
    writeWindowsWrapper(wrapperPath, configDir, binaryPath);
    const content = fs.readFileSync(wrapperPath, 'utf8');
    assert.ok(content.includes('CLAUDE_CONFIG_DIR'), 'Should set CLAUDE_CONFIG_DIR');
  } finally {
    cleanup(tempDir);
  }
});

test('writeWindowsWrapper sets TWEAKCC_CONFIG_DIR', () => {
  const tempDir = makeTempDir();
  const configDir = path.join(tempDir, 'config');
  const wrapperPath = path.join(tempDir, 'mclaude.cmd');
  const binaryPath = 'C:\\path\\to\\cli.js';

  fs.mkdirSync(configDir, { recursive: true });

  try {
    writeWindowsWrapper(wrapperPath, configDir, binaryPath);
    const content = fs.readFileSync(wrapperPath, 'utf8');
    assert.ok(content.includes('TWEAKCC_CONFIG_DIR'), 'Should set TWEAKCC_CONFIG_DIR');
  } finally {
    cleanup(tempDir);
  }
});

test('writeWindowsWrapper invokes node with binary path', () => {
  const tempDir = makeTempDir();
  const configDir = path.join(tempDir, 'config');
  const wrapperPath = path.join(tempDir, 'mclaude.cmd');
  const binaryPath = 'C:\\Users\\test\\.cc-mirror\\npm\\node_modules\\@anthropic-ai\\claude-code\\cli.js';

  fs.mkdirSync(configDir, { recursive: true });

  try {
    writeWindowsWrapper(wrapperPath, configDir, binaryPath);
    const content = fs.readFileSync(wrapperPath, 'utf8');
    assert.ok(content.includes('node'), 'Should invoke node');
    assert.ok(content.includes('cli.js'), 'Should reference cli.js');
  } finally {
    cleanup(tempDir);
  }
});

test('writeWindowsWrapper passes arguments with %*', () => {
  const tempDir = makeTempDir();
  const configDir = path.join(tempDir, 'config');
  const wrapperPath = path.join(tempDir, 'mclaude.cmd');
  const binaryPath = 'C:\\path\\to\\cli.js';

  fs.mkdirSync(configDir, { recursive: true });

  try {
    writeWindowsWrapper(wrapperPath, configDir, binaryPath);
    const content = fs.readFileSync(wrapperPath, 'utf8');
    assert.ok(content.includes('%*'), 'Should pass arguments with %*');
  } finally {
    cleanup(tempDir);
  }
});

test('writeWindowsWrapper handles CC_MIRROR_UNSET_AUTH_TOKEN', () => {
  const tempDir = makeTempDir();
  const configDir = path.join(tempDir, 'config');
  const wrapperPath = path.join(tempDir, 'mclaude.cmd');
  const binaryPath = 'C:\\path\\to\\cli.js';

  fs.mkdirSync(configDir, { recursive: true });

  try {
    writeWindowsWrapper(wrapperPath, configDir, binaryPath);
    const content = fs.readFileSync(wrapperPath, 'utf8');
    assert.ok(content.includes('CC_MIRROR_UNSET_AUTH_TOKEN'), 'Should handle unset auth token option');
  } finally {
    cleanup(tempDir);
  }
});

test('writeWindowsWrapper supports team mode via CLAUDE_CODE_TEAM_MODE', () => {
  const tempDir = makeTempDir();
  const configDir = path.join(tempDir, 'config');
  const wrapperPath = path.join(tempDir, 'mclaude.cmd');
  const binaryPath = 'C:\\path\\to\\cli.js';

  fs.mkdirSync(configDir, { recursive: true });

  try {
    writeWindowsWrapper(wrapperPath, configDir, binaryPath);
    const content = fs.readFileSync(wrapperPath, 'utf8');
    assert.ok(content.includes('CLAUDE_CODE_TEAM_MODE'), 'Should support team mode');
  } finally {
    cleanup(tempDir);
  }
});
