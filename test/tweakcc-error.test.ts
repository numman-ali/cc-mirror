import test from 'node:test';
import assert from 'node:assert/strict';
import { formatTweakccFailure } from '../src/core/errors.js';

const assertNativeHint = (msg: string) => {
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
