/**
 * PE resize: rewrite the .bun section's SizeOfRawData and Misc.VirtualSize.
 *
 * We require .bun to be the last raw-data section in the file. The guard
 * walks the section table and asserts no section's PointerToRawData lies
 * past .bun's. If that ever fails (a future Bun release inserts something
 * downstream), the patcher returns a structured error so the build pipeline
 * triggers Phase 1 rollback rather than corrupting downstream sections.
 */

import { OFFSETS_SIZE, PE_DOS_MAGIC, PE_NT_SIGNATURE, TRAILER } from '../bun-extract/constants.js';
import type { BunBinaryInfo } from '../bun-extract.js';

const SECTION_HEADER_SIZE = 40;
const NAME_BYTES = [0x2e, 0x62, 0x75, 0x6e, 0x00]; // ".bun\0"

export interface PeRepackInputs {
  buf: Buffer;
  info: BunBinaryInfo;
  newRawBytes: Buffer;
  newOffsetsStruct: Buffer;
}

export class PeNotLastSectionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PeNotLastSectionError';
  }
}

interface PeLayout {
  bunSectionHeaderOff: number;
  bunPointerToRawData: number;
  bunSizeOfRawData: number;
}

const findPeLayout = (buf: Buffer): PeLayout | null => {
  if (buf.length < 0x40) return null;
  if (buf.readUInt16LE(0) !== PE_DOS_MAGIC) return null;
  const peOff = buf.readUInt32LE(0x3c);
  if (peOff <= 0 || peOff + 24 > buf.length) return null;
  if (buf.readUInt32LE(peOff) !== PE_NT_SIGNATURE) return null;

  const numSections = buf.readUInt16LE(peOff + 6);
  const sizeOfOptional = buf.readUInt16LE(peOff + 20);
  const sectionsStart = peOff + 24 + sizeOfOptional;

  let bun: PeLayout | null = null;
  let highestPtr = -1;
  let highestSection = '';

  for (let i = 0; i < numSections; i += 1) {
    const base = sectionsStart + i * SECTION_HEADER_SIZE;
    if (base + SECTION_HEADER_SIZE > buf.length) return null;
    const ptr = buf.readUInt32LE(base + 20);
    const size = buf.readUInt32LE(base + 16);
    const isBun = NAME_BYTES.every((b, j) => buf[base + j] === b);
    if (isBun) {
      bun = { bunSectionHeaderOff: base, bunPointerToRawData: ptr, bunSizeOfRawData: size };
    }
    if (ptr > highestPtr) {
      highestPtr = ptr;
      highestSection = buf
        .subarray(base, base + 8)
        .toString('utf8')
        .replace(/\0+$/, '');
    }
  }

  if (!bun) return null;
  if (bun.bunPointerToRawData !== highestPtr) {
    throw new PeNotLastSectionError(
      `.bun is not the last raw-data section (highest is "${highestSection}" at ${highestPtr}; .bun is at ${bun.bunPointerToRawData})`
    );
  }
  return bun;
};

export const repackPe = ({ buf, info, newRawBytes, newOffsetsStruct }: PeRepackInputs): Buffer => {
  if (newOffsetsStruct.length !== OFFSETS_SIZE) {
    throw new Error(`PE repack: offsets struct must be ${OFFSETS_SIZE} bytes, got ${newOffsetsStruct.length}`);
  }
  if (info.sectionOffset === undefined) {
    throw new Error('PE repack: BunBinaryInfo missing sectionOffset (read-only path could not locate .bun section)');
  }

  const layout = findPeLayout(buf);
  if (!layout) {
    throw new Error('PE repack: could not locate .bun section header');
  }

  const newSectionSize = newRawBytes.length + OFFSETS_SIZE + TRAILER.length;

  // Pre-section bytes: everything up to .bun's PointerToRawData.
  // Section headers are part of this prefix; we patch the .bun section header in-place.
  const prefix = Buffer.from(buf.subarray(0, layout.bunPointerToRawData));

  // SizeOfRawData at base+16, Misc.VirtualSize at base+8.
  prefix.writeUInt32LE(newSectionSize, layout.bunSectionHeaderOff + 16);
  prefix.writeUInt32LE(newSectionSize, layout.bunSectionHeaderOff + 8);

  return Buffer.concat([prefix, newRawBytes, newOffsetsStruct, TRAILER]);
};
