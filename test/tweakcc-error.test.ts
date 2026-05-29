import test from 'node:test';
import assert from 'node:assert/strict';
import { formatTweakccFailure, isTweakccNativeExtractionFailure } from '../src/core/errors.js';

const assertNativeHint = (msg: string) => {
  assert.ok(msg.toLowerCase().includes('tweakcc'));
  assert.ok(msg.toLowerCase().includes('node-lief'));
  assert.ok(msg.toLowerCase().includes('--no-tweak'));
};

test('formatTweakccFailure maps classic native extraction errors', () => {
  const msg = formatTweakccFailure('Error: Could not extract JS from native binary: /tmp/claude');
  assertNativeHint(msg);
});

test('formatTweakccFailure maps tweakcc v4 native extraction errors', () => {
  const msg = formatTweakccFailure('Error: Failed to extract claude.js from native installation');
  assertNativeHint(msg);
});

test('formatTweakccFailure maps patched binary validation failures', () => {
  const msg = formatTweakccFailure(
    'cc-mirror validation failed: patched Claude Code binary failed --version: TypeError: Expected CommonJS module to have a function wrapper'
  );
  assert.ok(msg.toLowerCase().includes('failed to start'));
  assert.ok(msg.toLowerCase().includes('--no-tweak'));
});

test('isTweakccNativeExtractionFailure detects native extraction failures', () => {
  assert.equal(isTweakccNativeExtractionFailure('Error: Could not extract JS from native binary: /tmp/claude'), true);
  assert.equal(isTweakccNativeExtractionFailure('Error: Failed to extract claude.js from native installation'), true);
  assert.equal(isTweakccNativeExtractionFailure('Error: something else went wrong'), false);
});
