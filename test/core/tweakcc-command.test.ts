import test from 'node:test';
import assert from 'node:assert/strict';
import { getNpxCommand } from '../../src/core/tweakcc.js';

test('getNpxCommand resolves platform-appropriate executable', () => {
  const expected = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  assert.equal(getNpxCommand(), expected);
});
