import test from 'node:test';
import assert from 'node:assert/strict';

import { parseBunBinary } from '../../../src/core/bun-extract.js';
import { replaceEntryJs } from '../../../src/core/binary-patcher/replace-entry.js';
import { PeNotLastSectionError } from '../../../src/core/binary-patcher/pe-resize.js';
import { OFFSETS_SIZE, PE_DOS_MAGIC, PE_NT_SIGNATURE, TRAILER } from '../../../src/core/bun-extract/constants.js';
import { buildBunFixture, type FixtureModule } from '../../helpers/bun-fixture.js';

const threeModules: FixtureModule[] = [
  { name: 'src/header.js', content: 'HHHHHHHHHH' },
  { name: 'src/cli.js', content: 'CCCCCCCCCCCCCCCC' }, // entry, 16 bytes
  { name: 'src/footer.js', content: 'FFFFFFFFFFFFFFFFFFFF' },
];

const platforms: Array<'elf' | 'macho' | 'pe'> = ['elf', 'macho', 'pe'];

/** Reads back the raw bytes for a module by index and returns them as utf8. */
const readModuleContent = (buf: Buffer, info: ReturnType<typeof parseBunBinary>, index: number): string => {
  const mod = info.modules[index];
  return buf.subarray(info.dataStart + mod.contOff, info.dataStart + mod.contOff + mod.contLen).toString('utf8');
};

for (const platform of platforms) {
  test(`replaceEntryJs grows the entry on ${platform}`, () => {
    const fix = buildBunFixture({ platform, moduleStructSize: 52, modules: threeModules, entryPointId: 1 });
    const info = parseBunBinary(fix.buf);
    const newContent = Buffer.from('X'.repeat(64));
    const result = replaceEntryJs(fix.buf, info, newContent);

    assert.equal(result.delta, newContent.length - 16);

    const reparsed = parseBunBinary(result.buf);
    assert.equal(reparsed.modules.length, 3);
    assert.equal(reparsed.entryPointId, 1);
    assert.equal(readModuleContent(result.buf, reparsed, 0), 'HHHHHHHHHH');
    assert.equal(readModuleContent(result.buf, reparsed, 1), 'X'.repeat(64));
    assert.equal(readModuleContent(result.buf, reparsed, 2), 'FFFFFFFFFFFFFFFFFFFF');
    assert.equal(reparsed.modules[0].name, 'src/header.js');
    assert.equal(reparsed.modules[1].name, 'src/cli.js');
    assert.equal(reparsed.modules[2].name, 'src/footer.js');
  });

  test(`replaceEntryJs shrinks the entry on ${platform}`, () => {
    const fix = buildBunFixture({ platform, moduleStructSize: 52, modules: threeModules, entryPointId: 1 });
    const info = parseBunBinary(fix.buf);
    const newContent = Buffer.from('xy');
    const result = replaceEntryJs(fix.buf, info, newContent);

    assert.equal(result.delta, 2 - 16);

    const reparsed = parseBunBinary(result.buf);
    assert.equal(readModuleContent(result.buf, reparsed, 1), 'xy');
    assert.equal(readModuleContent(result.buf, reparsed, 0), 'HHHHHHHHHH');
    assert.equal(readModuleContent(result.buf, reparsed, 2), 'FFFFFFFFFFFFFFFFFFFF');
  });

  test(`replaceEntryJs handles same-size on ${platform}`, () => {
    const fix = buildBunFixture({ platform, moduleStructSize: 52, modules: threeModules, entryPointId: 1 });
    const info = parseBunBinary(fix.buf);
    const newContent = Buffer.from('1234567890ABCDEF'); // 16 bytes, same as entry
    const result = replaceEntryJs(fix.buf, info, newContent);

    assert.equal(result.delta, 0);

    const reparsed = parseBunBinary(result.buf);
    assert.equal(readModuleContent(result.buf, reparsed, 1), '1234567890ABCDEF');
    assert.equal(readModuleContent(result.buf, reparsed, 0), 'HHHHHHHHHH');
    assert.equal(readModuleContent(result.buf, reparsed, 2), 'FFFFFFFFFFFFFFFFFFFF');
  });

  test(`replaceEntryJs works with v36 module struct on ${platform}`, () => {
    const fix = buildBunFixture({ platform, moduleStructSize: 36, modules: threeModules, entryPointId: 1 });
    const info = parseBunBinary(fix.buf);
    assert.equal(info.moduleSize, 36);
    const newContent = Buffer.from('Z'.repeat(40));
    const result = replaceEntryJs(fix.buf, info, newContent);

    const reparsed = parseBunBinary(result.buf);
    assert.equal(reparsed.moduleSize, 36);
    assert.equal(readModuleContent(result.buf, reparsed, 1), 'Z'.repeat(40));
    assert.equal(readModuleContent(result.buf, reparsed, 0), 'HHHHHHHHHH');
    assert.equal(readModuleContent(result.buf, reparsed, 2), 'FFFFFFFFFFFFFFFFFFFF');
  });

  test(`replaceEntryJs handles entryPointId=0 (entry first) on ${platform}`, () => {
    const fix = buildBunFixture({ platform, moduleStructSize: 52, modules: threeModules, entryPointId: 0 });
    const info = parseBunBinary(fix.buf);
    const newContent = Buffer.from('NEWHEADER123456789012');
    const result = replaceEntryJs(fix.buf, info, newContent);

    const reparsed = parseBunBinary(result.buf);
    assert.equal(readModuleContent(result.buf, reparsed, 0), 'NEWHEADER123456789012');
    assert.equal(readModuleContent(result.buf, reparsed, 1), 'CCCCCCCCCCCCCCCC');
    assert.equal(readModuleContent(result.buf, reparsed, 2), 'FFFFFFFFFFFFFFFFFFFF');
  });

  test(`replaceEntryJs handles entryPointId=last on ${platform}`, () => {
    const fix = buildBunFixture({ platform, moduleStructSize: 52, modules: threeModules, entryPointId: 2 });
    const info = parseBunBinary(fix.buf);
    const newContent = Buffer.from('NEWFOOTER');
    const result = replaceEntryJs(fix.buf, info, newContent);

    const reparsed = parseBunBinary(result.buf);
    assert.equal(readModuleContent(result.buf, reparsed, 0), 'HHHHHHHHHH');
    assert.equal(readModuleContent(result.buf, reparsed, 1), 'CCCCCCCCCCCCCCCC');
    assert.equal(readModuleContent(result.buf, reparsed, 2), 'NEWFOOTER');
  });
}

test('replaceEntryJs strips LC_CODE_SIGNATURE on Mach-O when present', () => {
  const fix = buildBunFixture({
    platform: 'macho',
    moduleStructSize: 52,
    modules: threeModules,
    entryPointId: 1,
    withCodeSignature: true,
    trailingPadding: 256,
  });
  const info = parseBunBinary(fix.buf);
  assert.equal(info.hasCodeSignature, true);

  const result = replaceEntryJs(fix.buf, info, Buffer.from('Y'.repeat(32)));
  assert.equal(result.signatureInvalidated, true);
  assert.equal(result.signatureStripped, true);

  const reparsed = parseBunBinary(result.buf);
  assert.equal(reparsed.hasCodeSignature, false, 'LC_CODE_SIGNATURE should be gone after repack');
  assert.equal(readModuleContent(result.buf, reparsed, 1), 'Y'.repeat(32));
});

test('replaceEntryJs leaves Mach-O without code signature unchanged in flags', () => {
  const fix = buildBunFixture({
    platform: 'macho',
    moduleStructSize: 52,
    modules: threeModules,
    entryPointId: 1,
    withCodeSignature: false,
  });
  const info = parseBunBinary(fix.buf);
  assert.equal(info.hasCodeSignature, false);

  const result = replaceEntryJs(fix.buf, info, Buffer.from('YYYY'));
  assert.equal(result.signatureStripped, false);
  assert.equal(result.signatureInvalidated, false);
});

test('PE last-section guard rejects a binary where .bun is not last', () => {
  // Hand-build a PE with two sections: .bun then .extra (both at non-overlapping offsets).
  const dos = Buffer.alloc(0x80);
  dos.writeUInt16LE(PE_DOS_MAGIC, 0);
  dos.writeUInt32LE(0x80, 0x3c);

  const peStart = 0x80;
  // PE\0\0 + COFF FileHeader (20) = 24 bytes; we set NumberOfSections=2, SizeOfOptional=0.
  const coff = Buffer.alloc(24);
  coff.writeUInt32LE(PE_NT_SIGNATURE, 0);
  coff.writeUInt16LE(2, 6);
  coff.writeUInt16LE(0, 20);

  // Two section headers (40 bytes each).
  const section1 = Buffer.alloc(40);
  Buffer.from('.bun\0').copy(section1, 0);
  const section2 = Buffer.alloc(40);
  Buffer.from('.extra\0').copy(section2, 0);

  // Headers blob: dos (0x80) + coff (24) + section1 (40) + section2 (40) = 264 bytes.
  const headersLen = peStart + coff.length + section1.length + section2.length;
  // Place .bun at offset 264, then .extra after .bun's payload.
  const bunPayload = Buffer.concat([Buffer.from('hello'), Buffer.alloc(OFFSETS_SIZE), TRAILER]);
  const bunPtr = headersLen;
  const bunSize = bunPayload.length;
  const extraPtr = bunPtr + bunSize;
  const extraSize = 16;

  section1.writeUInt32LE(bunSize, 16);
  section1.writeUInt32LE(bunPtr, 20);
  section2.writeUInt32LE(extraSize, 16);
  section2.writeUInt32LE(extraPtr, 20);

  const fakeBuf = Buffer.concat([dos, coff, section1, section2, bunPayload, Buffer.alloc(extraSize)]);

  // Force-construct a BunBinaryInfo-shaped object the resize path will accept.
  // We don't go through parseBunBinary because the synthetic .bun payload here
  // is intentionally minimal (no real module table). The PE guard should fail
  // before the rewrite touches anything.
  const fakeInfo = {
    platform: 'pe' as const,
    dataStart: bunPtr,
    trailerOffset: bunPtr + 5 + OFFSETS_SIZE,
    byteCount: 5,
    moduleSize: 52 as const,
    modules: [],
    entryPointId: 0,
    flags: 0,
    sectionOffset: bunPtr,
    sectionSize: bunSize,
    hasCodeSignature: false,
    bunVersionHint: '>=1.3.13' as const,
  };

  // We can't actually call replaceEntryJs with empty modules; instead exercise
  // the repack guard directly by importing repackPe.
  return import('../../../src/core/binary-patcher/pe-resize.js').then(({ repackPe }) => {
    assert.throws(
      () =>
        repackPe({
          buf: fakeBuf,
          info: fakeInfo,
          newRawBytes: Buffer.from('hi'),
          newOffsetsStruct: Buffer.alloc(OFFSETS_SIZE),
        }),
      (err: unknown) => err instanceof PeNotLastSectionError
    );
  });
});
