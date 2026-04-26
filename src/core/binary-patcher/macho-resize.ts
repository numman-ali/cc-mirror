/**
 * Mach-O resize: rewrite the __BUN section_64 size field, rewrite the 8-byte
 * u64 size header at the section start, and (when present) strip the
 * LC_CODE_SIGNATURE load command. Re-signing is left to codesign.ts.
 *
 * We deliberately re-walk the load command table here instead of reusing
 * bun-extract/macho.ts. The read-only path uses heuristic scans tuned for
 * speed; the write path needs precise offsets and section-header location.
 */

import {
  MACHO_HEADER_SCAN_BYTES,
  MACHO_MAGIC_64,
  MACHO_MAGIC_64_BE,
  MACHO_SECTION_HEADER_SIZE,
  OFFSETS_SIZE,
  TRAILER,
} from '../bun-extract/constants.js';
import type { BunBinaryInfo } from '../bun-extract.js';

const LC_CODE_SIGNATURE = 0x1d;
const LC_SEGMENT_64 = 0x19;
const MACH_HEADER_64_SIZE = 32;
const LINKEDIT_SEGNAME = '__LINKEDIT';

export interface MachoRepackInputs {
  buf: Buffer;
  info: BunBinaryInfo;
  newRawBytes: Buffer;
  newOffsetsStruct: Buffer;
}

export interface MachoRepackResult {
  buf: Buffer;
  signatureStripped: boolean;
}

interface SectionHeaderLocation {
  /** File offset of the section_64 struct itself. */
  headerOffset: number;
}

interface CodeSigLocation {
  /** Offset of the LC_CODE_SIGNATURE load command within the buffer. */
  lcOffset: number;
  /** cmdsize field on the load command (always 16 for LC_CODE_SIGNATURE). */
  cmdsize: number;
  /** dataoff: file offset where the signature blob starts. */
  dataoff: number;
  /** datasize: byte length of the signature blob. */
  datasize: number;
}

interface LinkeditSegment {
  /** Offset of the LC_SEGMENT_64 load command within the buffer. */
  lcOffset: number;
  /** Current filesize (file bytes claimed by this segment). */
  filesize: bigint;
  /** Current vmsize (virtual memory bytes claimed by this segment). */
  vmsize: bigint;
}

const isMacho64 = (buf: Buffer): boolean => {
  if (buf.length < 4) return false;
  const magic = buf.readUInt32LE(0);
  return magic === MACHO_MAGIC_64 || magic === MACHO_MAGIC_64_BE;
};

/** Locate the section_64 struct for __BUN; returns its file offset (start of sectname). */
const findBunSectionHeader = (buf: Buffer): SectionHeaderLocation | null => {
  const limit = Math.min(buf.length, MACHO_HEADER_SCAN_BYTES);
  for (let i = 0; i < limit - 56; i += 1) {
    if (
      buf[i] === 0x5f &&
      buf[i + 1] === 0x5f &&
      buf[i + 2] === 0x62 &&
      buf[i + 3] === 0x75 &&
      buf[i + 4] === 0x6e &&
      buf[i + 5] === 0x00 &&
      buf[i + 16] === 0x5f &&
      buf[i + 17] === 0x5f &&
      buf[i + 18] === 0x42 &&
      buf[i + 19] === 0x55 &&
      buf[i + 20] === 0x4e
    ) {
      return { headerOffset: i };
    }
  }
  return null;
};

/**
 * Walk the mach_header_64 load-command table to find LC_CODE_SIGNATURE precisely.
 *
 * mach_header_64: magic(4) cputype(4) cpusubtype(4) filetype(4) ncmds(4)
 *                 sizeofcmds(4) flags(4) reserved(4) = 32 bytes.
 * Each load command starts with cmd(u32) cmdsize(u32). LC_CODE_SIGNATURE has
 * cmdsize=16 with dataoff(u32) datasize(u32) trailing.
 */
const findCodeSignatureLc = (buf: Buffer): CodeSigLocation | null => {
  if (!isMacho64(buf)) return null;
  if (buf.length < MACH_HEADER_64_SIZE) return null;
  const ncmds = buf.readUInt32LE(16);
  const sizeofcmds = buf.readUInt32LE(20);
  if (sizeofcmds === 0 || ncmds === 0) return null;

  let cursor = MACH_HEADER_64_SIZE;
  const end = MACH_HEADER_64_SIZE + sizeofcmds;
  if (end > buf.length) return null;

  for (let i = 0; i < ncmds; i += 1) {
    if (cursor + 8 > end) return null;
    const cmd = buf.readUInt32LE(cursor);
    const cmdsize = buf.readUInt32LE(cursor + 4);
    if (cmdsize < 8 || cursor + cmdsize > end) return null;
    if (cmd === LC_CODE_SIGNATURE && cmdsize === 16) {
      const dataoff = buf.readUInt32LE(cursor + 8);
      const datasize = buf.readUInt32LE(cursor + 12);
      return { lcOffset: cursor, cmdsize, dataoff, datasize };
    }
    cursor += cmdsize;
  }
  return null;
};

/**
 * Find the LC_SEGMENT_64 load command for __LINKEDIT, where the code signature
 * blob lives. Returning the lcOffset + filesize/vmsize lets stripCodeSignature
 * shrink the segment by the signature size so codesign can re-sign cleanly.
 *
 * LC_SEGMENT_64 layout: cmd(4) cmdsize(4) segname[16] vmaddr(8) vmsize(8)
 *                       fileoff(8) filesize(8) maxprot(4) initprot(4)
 *                       nsects(4) flags(4) = 72 bytes header
 */
const findLinkeditSegment = (buf: Buffer): LinkeditSegment | null => {
  if (buf.length < MACH_HEADER_64_SIZE) return null;
  const ncmds = buf.readUInt32LE(16);
  const sizeofcmds = buf.readUInt32LE(20);
  if (sizeofcmds === 0 || ncmds === 0) return null;

  let cursor = MACH_HEADER_64_SIZE;
  const end = MACH_HEADER_64_SIZE + sizeofcmds;
  if (end > buf.length) return null;

  for (let i = 0; i < ncmds; i += 1) {
    if (cursor + 8 > end) return null;
    const cmd = buf.readUInt32LE(cursor);
    const cmdsize = buf.readUInt32LE(cursor + 4);
    if (cmdsize < 8 || cursor + cmdsize > end) return null;
    if (cmd === LC_SEGMENT_64 && cmdsize >= 72) {
      const segname = buf
        .subarray(cursor + 8, cursor + 24)
        .toString('utf8')
        .replace(/\0+$/, '');
      if (segname === LINKEDIT_SEGNAME) {
        return {
          lcOffset: cursor,
          vmsize: buf.readBigUInt64LE(cursor + 32),
          filesize: buf.readBigUInt64LE(cursor + 48),
        };
      }
    }
    cursor += cmdsize;
  }
  return null;
};

/**
 * Strip the LC_CODE_SIGNATURE load command in place.
 *
 * Strategy: shift any subsequent load commands left by `cmdsize` bytes,
 * zero out the freed tail, decrement ncmds and sizeofcmds. We do not touch
 * the actual signature blob in the file; the trailing region gets dropped
 * naturally by the suffix replacement when the buffer is reassembled (the
 * old [rawBytes][offsets][trailer][codesig padding] suffix is replaced with
 * [newRaw][newOffsets][trailer]).
 */
const stripCodeSignature = (header: Buffer, lc: CodeSigLocation): void => {
  const ncmds = header.readUInt32LE(16);
  const sizeofcmds = header.readUInt32LE(20);
  const lcEnd = MACH_HEADER_64_SIZE + sizeofcmds;
  const tailStart = lc.lcOffset + lc.cmdsize;
  const tailLen = lcEnd - tailStart;

  if (tailLen > 0) {
    header.copyWithin(lc.lcOffset, tailStart, lcEnd);
  }
  // Zero out the freed cmdsize bytes at the end of the LC region.
  header.fill(0, lcEnd - lc.cmdsize, lcEnd);
  header.writeUInt32LE(ncmds - 1, 16);
  header.writeUInt32LE(sizeofcmds - lc.cmdsize, 20);
};

/**
 * Rewrite the section_64 size field for __BUN.
 *
 * section_64 layout: sectname[16] segname[16] addr(u64) size(u64) offset(u32)
 *                    align(u32) reloff(u32) nreloc(u32) flags(u32) ...
 * The size field sits at sectname_offset + 40.
 */
const rewriteSectionSize = (header: Buffer, headerOffset: number, newSize: number): void => {
  header.writeBigUInt64LE(BigInt(newSize), headerOffset + 40);
};

export const repackMacho = ({ buf, info, newRawBytes, newOffsetsStruct }: MachoRepackInputs): MachoRepackResult => {
  if (newOffsetsStruct.length !== OFFSETS_SIZE) {
    throw new Error(`Mach-O repack: offsets struct must be ${OFFSETS_SIZE} bytes, got ${newOffsetsStruct.length}`);
  }
  if (info.sectionOffset === undefined) {
    throw new Error(
      'Mach-O repack: BunBinaryInfo missing sectionOffset (read-only path could not locate __BUN section)'
    );
  }

  const sectionHeader = findBunSectionHeader(buf);
  if (!sectionHeader) {
    throw new Error('Mach-O repack: could not relocate __BUN section_64 struct for header rewrite');
  }

  // Pre-section bytes: everything from file start up to (and excluding) the section payload.
  // Layout: [mach_header + load_commands ...][section_64 payload at info.sectionOffset]
  const preSection = Buffer.from(buf.subarray(0, info.sectionOffset));

  // Strip LC_CODE_SIGNATURE if present. The signature blob sits at the tail of
  // __LINKEDIT, so we must also reduce that segment's filesize/vmsize by the
  // signature size - otherwise codesign rejects the patched binary with
  // "main executable failed strict validation" (LINKEDIT extends past EOF).
  let signatureStripped = false;
  const codeSig = findCodeSignatureLc(preSection);
  if (codeSig) {
    const linkedit = findLinkeditSegment(preSection);
    if (linkedit) {
      const sigSize = BigInt(codeSig.datasize);
      const newFilesize = linkedit.filesize > sigSize ? linkedit.filesize - sigSize : 0n;
      const newVmsize = linkedit.vmsize > sigSize ? linkedit.vmsize - sigSize : 0n;
      preSection.writeBigUInt64LE(newFilesize, linkedit.lcOffset + 48);
      preSection.writeBigUInt64LE(newVmsize, linkedit.lcOffset + 32);
    }
    stripCodeSignature(preSection, codeSig);
    signatureStripped = true;
  }

  // New section payload size: 8-byte u64 size header + rawBytes + offsets + trailer.
  const newSectionInnerSize = newRawBytes.length + OFFSETS_SIZE + TRAILER.length;
  const newSectionPayloadSize = MACHO_SECTION_HEADER_SIZE + newSectionInnerSize;

  // Rewrite section_64.size to the new payload size (Apple counts the entire
  // section content including the 8-byte u64 size prefix Bun emits).
  rewriteSectionSize(preSection, sectionHeader.headerOffset, newSectionPayloadSize);

  // 8-byte u64 LE size header at section start = inner rawBytes length only
  // (not including offsets/trailer), per Bun's emitter.
  const sectionSizeHeader = Buffer.alloc(MACHO_SECTION_HEADER_SIZE);
  sectionSizeHeader.writeBigUInt64LE(BigInt(newRawBytes.length), 0);

  // Drop any bytes after the original [rawBytes][offsets][trailer] suffix
  // (signature padding etc. — re-signing happens later via codesign).
  const out = Buffer.concat([preSection, sectionSizeHeader, newRawBytes, newOffsetsStruct, TRAILER]);
  return { buf: out, signatureStripped };
};
