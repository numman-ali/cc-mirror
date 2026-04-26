/**
 * ELF resize: Bun emits a `.bun` PROGBITS section that holds an 8-byte u64
 * size header followed by the standard [rawBytes][offsets(32)][trailer(16)]
 * payload. The section header table sits AFTER `.bun` (at file EOF region),
 * pointed to by e_shoff in the ELF header.
 *
 * Resizing requires (each was a real bug found while smoke-testing real CC
 * binaries inside docker):
 *   1. Swap the old [rawBytes][offsets][trailer] middle for the new bytes.
 *   2. Preserve the original ELF tail (section header table + string tables).
 *   3. Shift e_shoff (and e_phoff if it lives past the data region) by the
 *      resize delta so the kernel and ELF tools still find the tables.
 *   4. Rewrite the .bun section header's sh_size + the 8-byte u64 size
 *      header at the section start. Bun's standalone runtime locates the
 *      embedded payload via the .bun section.
 *   5. Grow the PT_LOAD program header that covers .bun: bump p_filesz +
 *      p_memsz by delta. Without this, the kernel's mmap stops short and
 *      reads past the original size hit unmapped pages -> SIGBUS / SIGILL.
 *      The original LOAD has ~one page of slack (filesz rounded up to align)
 *      so resizes < that slack happen to work, larger ones crash.
 */

import { MACHO_SECTION_HEADER_SIZE, OFFSETS_SIZE, TRAILER } from '../bun-extract/constants.js';
import type { BunBinaryInfo } from '../bun-extract.js';

const ELF_E_PHOFF = 32; // u64
const ELF_E_SHOFF = 40; // u64
const ELF_E_PHENTSIZE = 54; // u16
const ELF_E_PHNUM = 56; // u16
const ELF_E_SHENTSIZE = 58; // u16
const ELF_E_SHNUM = 60; // u16
const ELF_E_SHSTRNDX = 62; // u16

const ELF_SH_NAME = 0; // u32 — index into shstrtab
const ELF_SH_OFFSET = 24; // u64
const ELF_SH_SIZE = 32; // u64

const PT_LOAD = 1;
const ELF_PH_TYPE = 0; // u32
const ELF_PH_OFFSET = 8; // u64
const ELF_PH_FILESZ = 32; // u64
const ELF_PH_MEMSZ = 40; // u64

const BUN_SECTION_NAME = '.bun';

export interface ElfRepackInputs {
  buf: Buffer;
  info: BunBinaryInfo;
  newRawBytes: Buffer;
  newOffsetsStruct: Buffer;
}

const shiftU64IfPast = (header: Buffer, fieldOffset: number, cutoff: number, delta: number): void => {
  const original = header.readBigUInt64LE(fieldOffset);
  if (original > BigInt(cutoff)) {
    header.writeBigUInt64LE(original + BigInt(delta), fieldOffset);
  }
};

interface SectionHeaderTable {
  /** Absolute file offset of the section header table. */
  fileOff: number;
  count: number;
  entSize: number;
  /** Index of the section name string table. */
  shstrndx: number;
}

const readSectionHeaderTable = (elfHeader: Buffer): SectionHeaderTable | null => {
  if (elfHeader.length < ELF_E_SHSTRNDX + 2) return null;
  const fileOff = Number(elfHeader.readBigUInt64LE(ELF_E_SHOFF));
  const entSize = elfHeader.readUInt16LE(ELF_E_SHENTSIZE);
  const count = elfHeader.readUInt16LE(ELF_E_SHNUM);
  const shstrndx = elfHeader.readUInt16LE(ELF_E_SHSTRNDX);
  if (entSize < ELF_SH_SIZE + 8 || count === 0) return null;
  return { fileOff, count, entSize, shstrndx };
};

/**
 * Bump p_filesz + p_memsz on the PT_LOAD that covers the .bun section. Without
 * this, the kernel mmap stops at the old (page-aligned) p_filesz and Bun
 * SIGBUSes when it touches the new bytes past the original mapping.
 */
const growPtLoadCoveringSection = (prefix: Buffer, sectionPayloadStart: number, delta: number): void => {
  const phoff = Number(prefix.readBigUInt64LE(ELF_E_PHOFF));
  const phentsize = prefix.readUInt16LE(ELF_E_PHENTSIZE);
  const phnum = prefix.readUInt16LE(ELF_E_PHNUM);
  if (phentsize < ELF_PH_MEMSZ + 8 || phoff + phnum * phentsize > prefix.length) return;
  for (let i = 0; i < phnum; i += 1) {
    const off = phoff + i * phentsize;
    if (prefix.readUInt32LE(off + ELF_PH_TYPE) !== PT_LOAD) continue;
    const phOffset = Number(prefix.readBigUInt64LE(off + ELF_PH_OFFSET));
    const phFilesz = prefix.readBigUInt64LE(off + ELF_PH_FILESZ);
    if (phOffset > sectionPayloadStart || phOffset + Number(phFilesz) < sectionPayloadStart) continue;
    prefix.writeBigUInt64LE(phFilesz + BigInt(delta), off + ELF_PH_FILESZ);
    const phMemsz = prefix.readBigUInt64LE(off + ELF_PH_MEMSZ);
    prefix.writeBigUInt64LE(phMemsz + BigInt(delta), off + ELF_PH_MEMSZ);
  }
};

/** Find the .bun section header offset (within the ELF buffer) by walking the table. */
const findBunSectionHeaderOffset = (buf: Buffer, table: SectionHeaderTable): number | null => {
  // Locate shstrtab so we can resolve sh_name -> string.
  if (table.shstrndx >= table.count) return null;
  const shstrHeaderOff = table.fileOff + table.shstrndx * table.entSize;
  if (shstrHeaderOff + table.entSize > buf.length) return null;
  const shstrOff = Number(buf.readBigUInt64LE(shstrHeaderOff + ELF_SH_OFFSET));
  const shstrSize = Number(buf.readBigUInt64LE(shstrHeaderOff + ELF_SH_SIZE));
  if (shstrOff + shstrSize > buf.length) return null;

  for (let i = 0; i < table.count; i += 1) {
    const headerOff = table.fileOff + i * table.entSize;
    if (headerOff + table.entSize > buf.length) return null;
    const nameIdx = buf.readUInt32LE(headerOff + ELF_SH_NAME);
    if (nameIdx >= shstrSize) continue;
    const nameStart = shstrOff + nameIdx;
    const nameEnd = buf.indexOf(0, nameStart);
    if (nameEnd === -1 || nameEnd > shstrOff + shstrSize) continue;
    const name = buf.subarray(nameStart, nameEnd).toString('utf8');
    if (name === BUN_SECTION_NAME) return headerOff;
  }
  return null;
};

export const repackElf = ({ buf, info, newRawBytes, newOffsetsStruct }: ElfRepackInputs): Buffer => {
  if (newOffsetsStruct.length !== OFFSETS_SIZE) {
    throw new Error(`ELF repack: offsets struct must be ${OFFSETS_SIZE} bytes, got ${newOffsetsStruct.length}`);
  }
  const delta = newRawBytes.length - info.byteCount;
  const tailStart = info.trailerOffset + TRAILER.length;

  // Same-size: no header fields need patching, splice in place via subarrays.
  if (delta === 0) {
    return Buffer.concat([
      buf.subarray(0, info.dataStart),
      newRawBytes,
      newOffsetsStruct,
      TRAILER,
      buf.subarray(tailStart),
    ]);
  }

  // Writable copy of the prefix so we can patch e_shoff / e_phoff in the
  // ELF header (both sit past the data region in real CC binaries) plus
  // the inner u64 size header at the .bun section payload start.
  const prefix = Buffer.from(buf.subarray(0, info.dataStart));
  if (prefix.length >= ELF_E_SHOFF + 8) {
    shiftU64IfPast(prefix, ELF_E_SHOFF, info.dataStart, delta);
    shiftU64IfPast(prefix, ELF_E_PHOFF, info.dataStart, delta);
    const sectionPayloadStart = info.dataStart - MACHO_SECTION_HEADER_SIZE;
    growPtLoadCoveringSection(prefix, sectionPayloadStart, delta);
  }

  // Writable copy of the ELF tail so we can patch the .bun section header's
  // sh_size. The tail is everything after the original trailer; the section
  // header table lives somewhere inside it.
  const elfTail = tailStart < buf.length ? Buffer.from(buf.subarray(tailStart)) : Buffer.alloc(0);

  if (elfTail.length > 0) {
    const table = readSectionHeaderTable(prefix);
    if (table) {
      const bunHeaderOff = findBunSectionHeaderOffset(buf, table);
      if (bunHeaderOff !== null && bunHeaderOff >= tailStart) {
        const offsetWithinTail = bunHeaderOff - tailStart;
        if (offsetWithinTail + ELF_SH_SIZE + 8 <= elfTail.length) {
          const oldSize = elfTail.readBigUInt64LE(offsetWithinTail + ELF_SH_SIZE);
          elfTail.writeBigUInt64LE(oldSize + BigInt(delta), offsetWithinTail + ELF_SH_SIZE);
        }
      }
    }

    // Bun's inner u64 size header at the start of the .bun section payload.
    // Records rawBytes length only (no offsets/trailer); the parser exposes
    // dataStart already adjusted past it.
    const sectionPayloadStart = info.dataStart - MACHO_SECTION_HEADER_SIZE;
    if (sectionPayloadStart >= 0 && sectionPayloadStart + 8 <= prefix.length) {
      const oldInner = prefix.readBigUInt64LE(sectionPayloadStart);
      prefix.writeBigUInt64LE(oldInner + BigInt(delta), sectionPayloadStart);
    }
  }

  return Buffer.concat([prefix, newRawBytes, newOffsetsStruct, TRAILER, elfTail]);
};
