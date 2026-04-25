import { PE_DOS_MAGIC, PE_NT_SIGNATURE } from './constants.js';

export interface PeSection {
  pointerToRawData: number;
  sizeOfRawData: number;
}

export const isPe = (buf: Buffer): boolean => buf.length >= 2 && buf.readUInt16LE(0) === PE_DOS_MAGIC;

/**
 * Locate the .bun PE section by walking the section table.
 *
 * PE layout:
 *   DOS header at 0; e_lfanew (u32 LE) at 0x3C points to NT headers.
 *   NT headers: PE\0\0 (4) + COFF FileHeader (20) + OptionalHeader (variable).
 *   FileHeader.NumberOfSections (u16) at PE+0x06.
 *   FileHeader.SizeOfOptionalHeader (u16) at PE+0x14.
 *   Section headers (40 bytes each) start right after the optional header.
 *
 * Returns null if .bun is absent.
 */
export const findBunPeSection = (buf: Buffer): PeSection | null => {
  if (buf.length < 0x40) return null;
  const peOff = buf.readUInt32LE(0x3c);
  if (peOff <= 0 || peOff + 24 > buf.length) return null;
  if (buf.readUInt32LE(peOff) !== PE_NT_SIGNATURE) return null;

  const numSections = buf.readUInt16LE(peOff + 6);
  const sizeOfOptional = buf.readUInt16LE(peOff + 20);
  const sectionsStart = peOff + 24 + sizeOfOptional;

  for (let i = 0; i < numSections; i += 1) {
    const base = sectionsStart + i * 40;
    if (base + 40 > buf.length) return null;
    const name = buf.subarray(base, base + 8);
    // Section name is null-padded to 8 bytes; first 5 should be '.bun\0'.
    if (
      name[0] === 0x2e && // '.'
      name[1] === 0x62 && // 'b'
      name[2] === 0x75 && // 'u'
      name[3] === 0x6e && // 'n'
      name[4] === 0x00
    ) {
      const sizeOfRawData = buf.readUInt32LE(base + 16);
      const pointerToRawData = buf.readUInt32LE(base + 20);
      return { pointerToRawData, sizeOfRawData };
    }
  }
  return null;
};

/** PE has no 8-byte size header at the start of the section. */
export const peDataStart = (pointerToRawData: number): number => pointerToRawData;
