import test from 'node:test';
import assert from 'node:assert/strict';
import { getPlatform, isWindows, getWrapperExtension, getWrapperFilename } from '../../src/core/platform.js';

test('getPlatform returns current platform', () => {
  const platform = getPlatform();
  assert.ok(['win32', 'darwin', 'linux'].includes(platform), `Unexpected platform: ${platform}`);
});

test('isWindows returns true on Windows', () => {
  const result = isWindows();
  assert.strictEqual(typeof result, 'boolean');
  if (process.platform === 'win32') {
    assert.strictEqual(result, true);
  } else {
    assert.strictEqual(result, false);
  }
});

test('getWrapperExtension returns .cmd on Windows', () => {
  const ext = getWrapperExtension('win32');
  assert.strictEqual(ext, '.cmd');
});

test('getWrapperExtension returns empty string on Unix', () => {
  assert.strictEqual(getWrapperExtension('darwin'), '');
  assert.strictEqual(getWrapperExtension('linux'), '');
});

test('getWrapperFilename appends .cmd on Windows', () => {
  const filename = getWrapperFilename('mclaude', 'win32');
  assert.strictEqual(filename, 'mclaude.cmd');
});

test('getWrapperFilename returns name unchanged on Unix', () => {
  assert.strictEqual(getWrapperFilename('mclaude', 'darwin'), 'mclaude');
  assert.strictEqual(getWrapperFilename('mclaude', 'linux'), 'mclaude');
});
