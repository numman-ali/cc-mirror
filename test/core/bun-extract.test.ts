import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import { BunFormatError, extractAll, parseBunBinary } from '../../src/core/bun-extract.js';
import { OFFSETS_SIZE } from '../../src/core/bun-extract/constants.js';
import { buildBunFixture } from '../helpers/bun-fixture.js';
import { cleanup, makeTempDir } from '../helpers/fs-helpers.js';

const sampleModules = [
  { name: 'src/entrypoints/cli.js', content: '/* @bun */ console.log("hello")' },
  { name: 'src/lib/util.js', content: 'export const ok = true' },
  { name: 'node_modules/foo/index.js', content: 'module.exports = 42' },
];

test('parseBunBinary handles ELF with v52 module struct', () => {
  const fix = buildBunFixture({ platform: 'elf', moduleStructSize: 52, modules: sampleModules, entryPointId: 0 });
  const info = parseBunBinary(fix.buf);
  assert.equal(info.platform, 'elf');
  assert.equal(info.moduleSize, 52);
  assert.equal(info.bunVersionHint, '>=1.3.13');
  assert.equal(info.modules.length, 3);
  assert.equal(info.modules[0].name, 'src/entrypoints/cli.js');
  assert.equal(info.modules[0].isEntry, true);
  assert.equal(info.dataStart, fix.expected.dataStart);
});

test('parseBunBinary handles ELF with v36 module struct', () => {
  const fix = buildBunFixture({ platform: 'elf', moduleStructSize: 36, modules: sampleModules });
  const info = parseBunBinary(fix.buf);
  assert.equal(info.moduleSize, 36);
  assert.equal(info.bunVersionHint, 'pre-1.3.13');
  assert.equal(info.modules.length, 3);
  assert.equal(info.modules[1].name, 'src/lib/util.js');
});

test('parseBunBinary regression: ELF dataStart must be trailerOffset - byteCount - OFFSETS_SIZE', () => {
  const fix = buildBunFixture({ platform: 'elf', moduleStructSize: 52, modules: sampleModules });
  const info = parseBunBinary(fix.buf);
  // The legacy formula `trailerOffset + trailerLen - byteCount` would land 48 bytes past the real start.
  const legacyDataStart = info.trailerOffset + 16 /* trailer length */ - info.byteCount;
  assert.notEqual(info.dataStart, legacyDataStart);
  assert.equal(info.dataStart, info.trailerOffset - info.byteCount - OFFSETS_SIZE);
});

test('parseBunBinary handles Mach-O __BUN section with size header', () => {
  const fix = buildBunFixture({
    platform: 'macho',
    moduleStructSize: 52,
    modules: sampleModules,
    withCodeSignature: true,
    trailingPadding: 1024,
  });
  if (fix.platform !== 'macho') throw new Error('expected macho fixture');
  const info = parseBunBinary(fix.buf);
  assert.equal(info.platform, 'macho');
  assert.equal(info.dataStart, fix.expected.dataStart);
  assert.equal(info.sectionOffset, fix.expected.sectionOffset);
  assert.equal(info.hasCodeSignature, true);
  assert.equal(info.modules[0].name, 'src/entrypoints/cli.js');
});

test('parseBunBinary handles PE .bun section without size header', () => {
  const fix = buildBunFixture({ platform: 'pe', moduleStructSize: 52, modules: sampleModules });
  const info = parseBunBinary(fix.buf);
  assert.equal(info.platform, 'pe');
  assert.equal(info.dataStart, fix.expected.dataStart);
  assert.equal(info.modules.length, 3);
});

test('parseBunBinary throws BunFormatError when neither MODULE_SIZE validates', () => {
  const fix = buildBunFixture({ platform: 'elf', moduleStructSize: 52, modules: sampleModules });
  // Corrupt the trailer so the search fails.
  fix.buf.write('GARBAGE GARBAGE!', fix.buf.length - 16);
  assert.throws(
    () => parseBunBinary(fix.buf),
    (err: unknown) => err instanceof BunFormatError
  );
});

test('parseBunBinary throws on a totally non-Bun buffer', () => {
  const buf = Buffer.alloc(1024, 0xab);
  assert.throws(() => parseBunBinary(buf), BunFormatError);
});

test('extractAll writes module files and manifest', () => {
  const dir = makeTempDir('bun-extract-');
  try {
    const fix = buildBunFixture({ platform: 'elf', moduleStructSize: 52, modules: sampleModules });
    const info = parseBunBinary(fix.buf);
    const result = extractAll(fix.buf, info, dir);
    assert.ok(result.manifestPath);
    const cli = path.join(dir, 'src/entrypoints/cli.js');
    assert.ok(fs.existsSync(cli));
    assert.equal(fs.readFileSync(cli, 'utf8'), '/* @bun */ console.log("hello")');
    const manifest = JSON.parse(fs.readFileSync(result.manifestPath, 'utf8'));
    assert.equal(manifest.entryPoint, 'src/entrypoints/cli.js');
    assert.equal(manifest.platform, 'elf');
    assert.equal(manifest.modules.length, 3);
  } finally {
    cleanup(dir);
  }
});

test('extractAll refuses path traversal', () => {
  const dir = makeTempDir('bun-extract-');
  try {
    const fix = buildBunFixture({
      platform: 'elf',
      moduleStructSize: 52,
      modules: [{ name: '../../../etc/evil', content: 'pwned' }],
    });
    const info = parseBunBinary(fix.buf);
    assert.throws(() => extractAll(fix.buf, info, dir), BunFormatError);
  } finally {
    cleanup(dir);
  }
});

test('parseBunBinary strips $bunfs path prefixes', () => {
  const fix = buildBunFixture({
    platform: 'elf',
    moduleStructSize: 52,
    modules: [
      { name: '/$bunfs/root/src/main.js', content: '1' },
      { name: '$bunfs/root/lib/x.js', content: '2' },
    ],
  });
  const info = parseBunBinary(fix.buf);
  assert.equal(info.modules[0].name, 'src/main.js');
  assert.equal(info.modules[1].name, 'lib/x.js');
});
