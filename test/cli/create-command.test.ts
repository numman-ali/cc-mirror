import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveCreateVariantName } from '../../src/cli/commands/create.js';

test('resolveCreateVariantName prefers --name when provided', () => {
  const name = resolveCreateVariantName('from-flag', 'from-positional', 'openrouter', 'provider-default');
  assert.equal(name, 'from-flag');
});

test('resolveCreateVariantName falls back to positional name', () => {
  const name = resolveCreateVariantName(undefined, 'openrouter-cc', 'openrouter', 'provider-default');
  assert.equal(name, 'openrouter-cc');
});

test('resolveCreateVariantName falls back to provider default', () => {
  const name = resolveCreateVariantName(undefined, undefined, 'openrouter', 'provider-default');
  assert.equal(name, 'provider-default');
});

test('resolveCreateVariantName finally falls back to provider key', () => {
  const name = resolveCreateVariantName(undefined, undefined, 'openrouter', undefined);
  assert.equal(name, 'openrouter');
});
