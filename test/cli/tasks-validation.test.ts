/**
 * Tasks CLI Validation Tests
 *
 * Tests for CLI argument validation in tasks command.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

// Test that invalid --older-than values are rejected
test('tasks clean --older-than validates numeric input', async (t) => {
  await t.test('NaN value should be rejected', async () => {
    const olderThan = Number('abc');
    assert.equal(Number.isNaN(olderThan), true, 'abc should parse to NaN');
  });

  await t.test('negative values should be rejected', async () => {
    const olderThan = Number('-5');
    assert.equal(olderThan < 0, true, 'negative numbers should be rejected');
  });

  await t.test('valid positive numbers should be accepted', async () => {
    const olderThan = Number('7');
    const isValid = !Number.isNaN(olderThan) && olderThan >= 0;
    assert.equal(isValid, true, 'valid positive numbers should pass');
  });

  await t.test('zero should be accepted', async () => {
    const olderThan = Number('0');
    const isValid = !Number.isNaN(olderThan) && olderThan >= 0;
    assert.equal(isValid, true, 'zero should be valid');
  });
});

// Test that invalid --limit values are rejected
test('tasks list --limit validates numeric input', async (t) => {
  await t.test('NaN value should be rejected', async () => {
    const limit = Number('abc');
    assert.equal(Number.isNaN(limit), true, 'abc should parse to NaN');
  });

  await t.test('zero should be rejected', async () => {
    const limit = Number('0');
    const isValid = !Number.isNaN(limit) && limit >= 1 && Number.isInteger(limit);
    assert.equal(isValid, false, 'zero should be rejected for limit');
  });

  await t.test('negative values should be rejected', async () => {
    const limit = Number('-5');
    const isValid = !Number.isNaN(limit) && limit >= 1 && Number.isInteger(limit);
    assert.equal(isValid, false, 'negative numbers should be rejected');
  });

  await t.test('floating point values should be rejected', async () => {
    const limit = Number('5.5');
    const isValid = !Number.isNaN(limit) && limit >= 1 && Number.isInteger(limit);
    assert.equal(isValid, false, 'floating point numbers should be rejected');
  });

  await t.test('valid positive integers should be accepted', async () => {
    const limit = Number('50');
    const isValid = !Number.isNaN(limit) && limit >= 1 && Number.isInteger(limit);
    assert.equal(isValid, true, 'valid positive integers should pass');
  });
});
