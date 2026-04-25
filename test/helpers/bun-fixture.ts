/**
 * Synthetic Bun standalone-binary fixture builder.
 *
 * Produces in-memory buffers that emulate the StandaloneModuleGraph layout
 * for ELF/Mach-O/PE so the extractor can be unit-tested without shipping
 * real bun-compiled binaries.
 */

import { Buffer } from 'node:buffer';

export interface FixtureModule {
  name: string;
  content: Buffer | string;
  sourcemap?: Buffer | string;
  bytecode?: Buffer | string;
  encoding?: number;
  loader?: number;
  format?: number;
  side?: number;
}

export interface FixtureOptions {
  platform: 'elf' | 'macho' | 'pe';
  moduleStructSize: 36 | 52;
  modules: FixtureModule[];
  entryPointId?: number;
  flags?: number;
  /** For Mach-O: include LC_CODE_SIGNATURE marker. */
  withCodeSignature?: boolean;
  /** For Mach-O: bytes of leading code-signature padding to insert AFTER trailer (simulating macOS layout). */
  trailingPadding?: number;
}

const TRAILER = Buffer.from('\n---- Bun! ----\n');
const OFFSETS_SIZE = 32;

const toBuf = (v: Buffer | string | undefined): Buffer => {
  if (!v) return Buffer.alloc(0);
  return typeof v === 'string' ? Buffer.from(v, 'utf8') : v;
};

const writeStringPointer = (buf: Buffer, base: number, offset: number, length: number) => {
  buf.writeUInt32LE(offset, base);
  buf.writeUInt32LE(length, base + 4);
};

interface RawBytesAndTable {
  rawBytes: Buffer;
  byteCount: number;
  modulesOff: number;
  modulesLen: number;
}

const buildRawBytesAndTable = (opts: FixtureOptions): RawBytesAndTable => {
  const moduleStructSize = opts.moduleStructSize;
  const flagsBase = moduleStructSize === 36 ? 32 : 48;

  // Pack the data region: each module contributes (name) + (content) + (sourcemap?) + (bytecode?).
  type PackedModule = {
    nameOff: number;
    nameLen: number;
    contOff: number;
    contLen: number;
    smapOff: number;
    smapLen: number;
    bcOff: number;
    bcLen: number;
    flags: number[];
  };

  const dataChunks: Buffer[] = [];
  let dataCursor = 0;
  const packed: PackedModule[] = [];

  const append = (b: Buffer) => {
    const off = dataCursor;
    dataChunks.push(b);
    dataCursor += b.length;
    return off;
  };

  for (const mod of opts.modules) {
    const nameBuf = Buffer.from(mod.name, 'utf8');
    const contBuf = toBuf(mod.content);
    const smapBuf = toBuf(mod.sourcemap);
    const bcBuf = toBuf(mod.bytecode);
    const nameOff = append(nameBuf);
    const contOff = append(contBuf);
    const smapOff = smapBuf.length > 0 ? append(smapBuf) : 0;
    const bcOff = bcBuf.length > 0 ? append(bcBuf) : 0;
    packed.push({
      nameOff,
      nameLen: nameBuf.length,
      contOff,
      contLen: contBuf.length,
      smapOff,
      smapLen: smapBuf.length,
      bcOff,
      bcLen: bcBuf.length,
      flags: [
        mod.encoding ?? 2, // utf8
        mod.loader ?? 1, // js
        mod.format ?? 1, // esm
        mod.side ?? 0, // server
      ],
    });
  }

  // Module table follows the data region.
  const modulesOff = dataCursor;
  const modulesLen = packed.length * moduleStructSize;
  const tableBuf = Buffer.alloc(modulesLen);
  for (let i = 0; i < packed.length; i += 1) {
    const base = i * moduleStructSize;
    const m = packed[i];
    writeStringPointer(tableBuf, base, m.nameOff, m.nameLen);
    writeStringPointer(tableBuf, base + 8, m.contOff, m.contLen);
    writeStringPointer(tableBuf, base + 16, m.smapOff, m.smapLen);
    writeStringPointer(tableBuf, base + 24, m.bcOff, m.bcLen);
    // For v52, bytes 32..47 are extra StringPointers we don't need to populate (zeros are fine).
    tableBuf.writeUInt8(m.flags[0], base + flagsBase);
    tableBuf.writeUInt8(m.flags[1], base + flagsBase + 1);
    tableBuf.writeUInt8(m.flags[2], base + flagsBase + 2);
    tableBuf.writeUInt8(m.flags[3], base + flagsBase + 3);
  }
  dataChunks.push(tableBuf);
  dataCursor += tableBuf.length;

  const rawBytes = Buffer.concat(dataChunks);
  return {
    rawBytes,
    byteCount: rawBytes.length,
    modulesOff,
    modulesLen,
  };
};

const buildOffsetsStruct = (info: RawBytesAndTable, entryPointId: number, flags: number): Buffer => {
  const offsets = Buffer.alloc(OFFSETS_SIZE);
  offsets.writeBigUInt64LE(BigInt(info.byteCount), 0);
  offsets.writeUInt32LE(info.modulesOff, 8);
  offsets.writeUInt32LE(info.modulesLen, 12);
  offsets.writeUInt32LE(entryPointId, 16);
  // exec_argv StringPointer at +20/+24 (zeros)
  offsets.writeUInt32LE(flags, 28);
  return offsets;
};

const buildElfBinary = (opts: FixtureOptions): { buf: Buffer; expected: { dataStart: number } } => {
  const elfHeader = Buffer.alloc(64);
  elfHeader[0] = 0x7f;
  elfHeader[1] = 0x45;
  elfHeader[2] = 0x4c;
  elfHeader[3] = 0x46;
  // The rest can stay zero - we only care about magic for detection.

  const tableInfo = buildRawBytesAndTable(opts);
  const offsets = buildOffsetsStruct(tableInfo, opts.entryPointId ?? 0, opts.flags ?? 0);
  const buf = Buffer.concat([elfHeader, tableInfo.rawBytes, offsets, TRAILER]);
  return { buf, expected: { dataStart: elfHeader.length } };
};

const buildMachoBinary = (
  opts: FixtureOptions
): { buf: Buffer; expected: { dataStart: number; sectionOffset: number } } => {
  // Stub Mach-O 64 header: just the magic + a synthetic section_64 header located in first 8 KB.
  // We avoid full Mach-O conformance; the extractor only needs the sectname/segname pattern.
  const header = Buffer.alloc(4096);
  header.writeUInt32LE(0xfeedfacf, 0); // MH_MAGIC_64

  // Place a section_64 header at offset 256.
  const sectionHeaderOff = 256;
  // sectname __bun\0 padded to 16
  Buffer.from('__bun\0').copy(header, sectionHeaderOff);
  // segname __BUN at +16
  Buffer.from('__BUN\0').copy(header, sectionHeaderOff + 16);

  const tableInfo = buildRawBytesAndTable(opts);
  // sectionOffset is where the Mach-O section_64 payload starts in the file:
  // immediately after `header`. The first 8 bytes of that payload are a u64 LE
  // length prefix; the parser does sectionOffset + 8 to skip it.
  const sectionOffset = header.length;
  const sectionDataLen = tableInfo.rawBytes.length + OFFSETS_SIZE + TRAILER.length;
  // size at +40 (u64 LE), offset at +48 (u32 LE)
  header.writeBigUInt64LE(BigInt(sectionDataLen), sectionHeaderOff + 40);
  header.writeUInt32LE(sectionOffset, sectionHeaderOff + 48);

  // Optional LC_CODE_SIGNATURE marker (cmd=0x1d, cmdsize=16) somewhere in the load-command region.
  if (opts.withCodeSignature) {
    const lcOff = 1024;
    header.writeUInt32LE(0x1d, lcOff);
    header.writeUInt32LE(16, lcOff + 4);
  }

  // Section payload: 8-byte u64 size header, then rawBytes, offsets, trailer.
  const sectionSizeHeader = Buffer.alloc(8);
  sectionSizeHeader.writeBigUInt64LE(BigInt(tableInfo.rawBytes.length), 0);
  const offsets = buildOffsetsStruct(tableInfo, opts.entryPointId ?? 0, opts.flags ?? 0);
  const padding = opts.trailingPadding ? Buffer.alloc(opts.trailingPadding) : Buffer.alloc(0);

  const buf = Buffer.concat([header, sectionSizeHeader, tableInfo.rawBytes, offsets, TRAILER, padding]);
  return {
    buf,
    expected: { dataStart: sectionOffset + 8, sectionOffset },
  };
};

const buildPeBinary = (
  opts: FixtureOptions
): { buf: Buffer; expected: { dataStart: number; pointerToRawData: number } } => {
  // Minimal-but-valid PE skeleton: DOS header (64) -> e_lfanew points to NT headers.
  const dos = Buffer.alloc(64);
  dos.writeUInt16LE(0x5a4d, 0); // 'MZ'
  const peOff = 0x80;
  dos.writeUInt32LE(peOff, 0x3c);

  const ntPrefix = Buffer.alloc(peOff - dos.length);
  // PE\0\0 + COFF header(20) + optional header (we'll size it as 0 for simplicity).
  const coff = Buffer.alloc(24); // PE sig (4) + FileHeader (20)
  coff.writeUInt32LE(0x00004550, 0);
  coff.writeUInt16LE(1, 6); // NumberOfSections = 1
  coff.writeUInt16LE(0, 20); // SizeOfOptionalHeader = 0

  // Section header (40 bytes): name '.bun' padded, then sizes/offsets we care about.
  const sectionHeader = Buffer.alloc(40);
  Buffer.from('.bun\0').copy(sectionHeader, 0);

  const headerBlob = Buffer.concat([dos, ntPrefix, coff, sectionHeader]);

  // Section payload starts at PointerToRawData. Place it immediately after the headers.
  const tableInfo = buildRawBytesAndTable(opts);
  const pointerToRawData = headerBlob.length;
  const sizeOfRawData = tableInfo.rawBytes.length + OFFSETS_SIZE + TRAILER.length;
  // SizeOfRawData at section header +16, PointerToRawData at +20.
  headerBlob.writeUInt32LE(sizeOfRawData, peOff + 24 + 0 * 40 + 16);
  headerBlob.writeUInt32LE(pointerToRawData, peOff + 24 + 0 * 40 + 20);

  const offsets = buildOffsetsStruct(tableInfo, opts.entryPointId ?? 0, opts.flags ?? 0);
  const buf = Buffer.concat([headerBlob, tableInfo.rawBytes, offsets, TRAILER]);
  return { buf, expected: { dataStart: pointerToRawData, pointerToRawData } };
};

export type FixtureBuildResult =
  | { platform: 'elf'; buf: Buffer; expected: { dataStart: number } }
  | { platform: 'macho'; buf: Buffer; expected: { dataStart: number; sectionOffset: number } }
  | { platform: 'pe'; buf: Buffer; expected: { dataStart: number; pointerToRawData: number } };

export const buildBunFixture = (opts: FixtureOptions): FixtureBuildResult => {
  if (opts.platform === 'elf') return { platform: 'elf', ...buildElfBinary(opts) };
  if (opts.platform === 'macho') return { platform: 'macho', ...buildMachoBinary(opts) };
  return { platform: 'pe', ...buildPeBinary(opts) };
};
