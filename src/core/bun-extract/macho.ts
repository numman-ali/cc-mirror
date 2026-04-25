import {
  MACHO_HEADER_SCAN_BYTES,
  MACHO_MAGIC_64,
  MACHO_MAGIC_64_BE,
  MACHO_MAGIC_FAT,
  MACHO_MAGIC_FAT_LE,
  MACHO_SECTION_HEADER_SIZE,
} from './constants.js';

export interface MachoSection {
  sectionOffset: number;
  sectionSize: number;
  /** Whether the binary contains an LC_CODE_SIGNATURE load command (best-effort scan). */
  hasCodeSignature: boolean;
}

const LC_CODE_SIGNATURE = 0x1d;

export const isMacho = (buf: Buffer): boolean => {
  if (buf.length < 4) return false;
  const magic = buf.readUInt32LE(0);
  return (
    magic === MACHO_MAGIC_64 || magic === MACHO_MAGIC_64_BE || magic === MACHO_MAGIC_FAT || magic === MACHO_MAGIC_FAT_LE
  );
};

/**
 * Locate the __BUN/__bun section by scanning the first MACHO_HEADER_SCAN_BYTES
 * for the literal section_64 layout: sectname[16] = "__bun\0...", segname[16] = "__BUN\0..."
 *
 * This is the same heuristic vicnaum/bun-demincer uses. It avoids walking the full
 * load-command table, but is reliable in practice because Bun emits exactly one
 * such section at a deterministic location.
 *
 * Returns null if no match is found (caller falls back to the trailer-driven path).
 */
export const findBunSection = (buf: Buffer): MachoSection | null => {
  const limit = Math.min(buf.length, MACHO_HEADER_SCAN_BYTES);
  let sectionOffset = -1;
  let sectionSize = 0;

  for (let i = 0; i < limit - 56; i += 1) {
    // sectname "__bun\0"
    if (
      buf[i] === 0x5f &&
      buf[i + 1] === 0x5f &&
      buf[i + 2] === 0x62 &&
      buf[i + 3] === 0x75 &&
      buf[i + 4] === 0x6e &&
      buf[i + 5] === 0x00 &&
      // segname "__BUN" 16 bytes later
      buf[i + 16] === 0x5f &&
      buf[i + 17] === 0x5f &&
      buf[i + 18] === 0x42 &&
      buf[i + 19] === 0x55 &&
      buf[i + 20] === 0x4e
    ) {
      // section_64 layout: sectname[16] segname[16] addr(u64) size(u64) offset(u32) align(u32) ...
      sectionSize = Number(buf.readBigUInt64LE(i + 40));
      sectionOffset = buf.readUInt32LE(i + 48);
      break;
    }
  }

  if (sectionOffset < 0) return null;
  return {
    sectionOffset,
    sectionSize,
    hasCodeSignature: scanForCodeSignatureCmd(buf, limit),
  };
};

/**
 * Best-effort detection: scan the load-command region for an LC_CODE_SIGNATURE marker.
 * We only need a flag for write-back warnings, not exact offsets, so an exact load-command
 * walk isn't required.
 */
const scanForCodeSignatureCmd = (buf: Buffer, limit: number): boolean => {
  for (let i = 0; i < limit - 8; i += 4) {
    if (buf.readUInt32LE(i) === LC_CODE_SIGNATURE) {
      const size = buf.readUInt32LE(i + 4);
      // Real LC_CODE_SIGNATURE has cmdsize 16. Use that as a weak signal to avoid false hits.
      if (size === 16) return true;
    }
  }
  return false;
};

/** Mach-O dataStart sits past the 8-byte u64 size prefix at the section start. */
export const machoDataStart = (sectionOffset: number): number => sectionOffset + MACHO_SECTION_HEADER_SIZE;
