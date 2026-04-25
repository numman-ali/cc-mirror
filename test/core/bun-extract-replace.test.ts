import test from 'node:test';
import assert from 'node:assert/strict';

import { ModuleNotFound, SizeMismatch, parseBunBinary, replaceModule } from '../../src/core/bun-extract.js';
import { buildBunFixture } from '../helpers/bun-fixture.js';

const modules = [
  { name: 'src/cli.js', content: 'AAAAAAAAAA' },
  { name: 'src/lib.js', content: 'BBBBBBBBBB' },
];

test('replaceModule round-trips a same-size content swap', () => {
  const fix = buildBunFixture({ platform: 'elf', moduleStructSize: 52, modules });
  const info = parseBunBinary(fix.buf);
  const replacement = Buffer.from('CCCCCCCCCC');
  const result = replaceModule(fix.buf, info, 'src/cli.js', replacement);
  assert.equal(result.signatureInvalidated, false);

  const reparsed = parseBunBinary(result.buf);
  const cli = reparsed.modules.find((m) => m.name === 'src/cli.js');
  assert.ok(cli, 'cli module should be present after replace');
  const slice = result.buf.subarray(reparsed.dataStart + cli.contOff, reparsed.dataStart + cli.contOff + cli.contLen);
  assert.equal(slice.toString('utf8'), 'CCCCCCCCCC');
});

test('replaceModule throws SizeMismatch when sizes differ', () => {
  const fix = buildBunFixture({ platform: 'elf', moduleStructSize: 52, modules });
  const info = parseBunBinary(fix.buf);
  assert.throws(() => replaceModule(fix.buf, info, 'src/cli.js', Buffer.from('shorter')), SizeMismatch);
});

test('replaceModule throws ModuleNotFound for unknown modules', () => {
  const fix = buildBunFixture({ platform: 'elf', moduleStructSize: 52, modules });
  const info = parseBunBinary(fix.buf);
  assert.throws(() => replaceModule(fix.buf, info, 'nope.js', Buffer.alloc(0)), ModuleNotFound);
});

test('replaceModule flags Mach-O code signature as invalidated', () => {
  const fix = buildBunFixture({
    platform: 'macho',
    moduleStructSize: 52,
    modules,
    withCodeSignature: true,
    trailingPadding: 512,
  });
  const info = parseBunBinary(fix.buf);
  const result = replaceModule(fix.buf, info, 'src/cli.js', Buffer.from('CCCCCCCCCC'));
  assert.equal(result.signatureInvalidated, true);
});

test('replaceModule on Mach-O without signature reports signatureInvalidated=false', () => {
  const fix = buildBunFixture({
    platform: 'macho',
    moduleStructSize: 52,
    modules,
    withCodeSignature: false,
  });
  const info = parseBunBinary(fix.buf);
  const result = replaceModule(fix.buf, info, 'src/cli.js', Buffer.from('CCCCCCCCCC'));
  assert.equal(result.signatureInvalidated, false);
});
