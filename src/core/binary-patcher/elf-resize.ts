/**
 * ELF resize: data is appended at EOF as [rawBytes][offsets(32)][trailer(16)].
 *
 * Resizing means dropping the old [rawBytes][offsets][trailer] suffix from the
 * original buffer and concatenating the new ones. The ELF program/section
 * headers ahead of the appended region are untouched - the kernel never reads
 * the appended bytes through them.
 */

import { OFFSETS_SIZE, TRAILER } from '../bun-extract/constants.js';
import type { BunBinaryInfo } from '../bun-extract.js';

export interface ElfRepackInputs {
  buf: Buffer;
  info: BunBinaryInfo;
  newRawBytes: Buffer;
  newOffsetsStruct: Buffer;
}

export const repackElf = ({ buf, info, newRawBytes, newOffsetsStruct }: ElfRepackInputs): Buffer => {
  if (newOffsetsStruct.length !== OFFSETS_SIZE) {
    throw new Error(`ELF repack: offsets struct must be ${OFFSETS_SIZE} bytes, got ${newOffsetsStruct.length}`);
  }
  // Original prefix is everything before the appended region.
  const prefix = buf.subarray(0, info.dataStart);
  return Buffer.concat([prefix, newRawBytes, newOffsetsStruct, TRAILER]);
};
