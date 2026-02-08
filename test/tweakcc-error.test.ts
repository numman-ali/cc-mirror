import test from 'node:test';
import assert from 'node:assert/strict';
import { formatTweakccFailure } from '../src/core/errors.js';

test('formatTweakccFailure maps native extraction errors', () => {
  const msg = formatTweakccFailure('Error: Could not extract JS from native binary: /tmp/claude');
  assert.ok(msg.toLowerCase().includes('node-lief'));
  assert.ok(msg.toLowerCase().includes('--no-tweak'));
});
