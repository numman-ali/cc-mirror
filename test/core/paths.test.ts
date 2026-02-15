import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { expandTilde } from '../../src/core/paths.js';

test('expandTilde expands "~" to the current home directory', () => {
  assert.equal(expandTilde('~'), os.homedir());
});

test('expandTilde expands "~/" paths', () => {
  assert.equal(expandTilde('~/cc-mirror'), path.join(os.homedir(), 'cc-mirror'));
});

test('expandTilde expands "~\\\\" paths', () => {
  assert.equal(expandTilde('~\\cc-mirror'), path.join(os.homedir(), 'cc-mirror'));
});
