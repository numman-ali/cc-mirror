import test from 'node:test';
import assert from 'node:assert/strict';

import { BunWrapperNotFound, stripBunWrapper } from '../../../src/core/binary-patcher/strip-bun-wrapper.js';

const wrap = (body: string): string =>
  `// @bun @bytecode @bun-cjs\n(function(exports, require, module, __filename, __dirname) {${body}})`;

test('stripBunWrapper removes the Bun CJS wrapper', () => {
  const body = 'console.log("hi");';
  assert.equal(stripBunWrapper(wrap(body)), body);
});

test('stripBunWrapper handles trailing whitespace + semicolon', () => {
  const body = 'console.log("hi");';
  assert.equal(stripBunWrapper(`${wrap(body)};\n  `), body);
});

test('stripBunWrapper preserves nested braces in the body', () => {
  const body = 'function f(){return{a:1,b:{c:2}}}f();';
  assert.equal(stripBunWrapper(wrap(body)), body);
});

test('stripBunWrapper is a no-op on a file without the wrapper', () => {
  const plain = 'module.exports = { ok: true };';
  assert.equal(stripBunWrapper(plain), plain);
});

test('stripBunWrapper throws when the close anchor is missing', () => {
  const broken = '// @bun foo\n(function(a, b) {let x = 1;\n';
  assert.throws(
    () => stripBunWrapper(broken),
    (err: unknown) => err instanceof BunWrapperNotFound && err.anchor === 'close'
  );
});

test('stripBunWrapper throws when @bun marker exists but signature is malformed', () => {
  const broken = '// @bun foo\nnotAFunctionExpression()';
  assert.throws(
    () => stripBunWrapper(broken),
    (err: unknown) => err instanceof BunWrapperNotFound && err.anchor === 'open'
  );
});
