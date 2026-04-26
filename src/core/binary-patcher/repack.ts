/**
 * Cross-platform Bun standalone-binary repack with resize support.
 *
 * Inputs: the original buffer + parsed BunBinaryInfo + a newly-built rawBytes
 * region (data slabs followed by the module table) and a freshly-built
 * Offsets struct. Output: a buffer that boots correctly on the target
 * platform with the new payload.
 *
 * Caller responsibilities:
 *  - Build newRawBytes with all StringPointer offsets already adjusted for
 *    the resize delta. repack does NOT rewrite the module table.
 *  - Build newOffsetsStruct with the new byteCount and (possibly shifted)
 *    modulesOff. repack does NOT rewrite the offsets struct.
 *
 * What repack owns: the platform container plumbing (Mach-O section_64 size
 * field + 8-byte size header + LC_CODE_SIGNATURE strip; PE .bun section
 * header SizeOfRawData/VirtualSize + last-section guard; ELF appended-region
 * truncation).
 */

import { repackElf } from './elf-resize.js';
import { repackMacho } from './macho-resize.js';
import { repackPe } from './pe-resize.js';
import type { BunBinaryInfo } from '../bun-extract.js';

export interface RepackInputs {
  buf: Buffer;
  info: BunBinaryInfo;
  newRawBytes: Buffer;
  newOffsetsStruct: Buffer;
}

export interface RepackResult {
  buf: Buffer;
  signatureStripped: boolean;
}

export const repackBinary = ({ buf, info, newRawBytes, newOffsetsStruct }: RepackInputs): RepackResult => {
  switch (info.platform) {
    case 'elf':
      return {
        buf: repackElf({ buf, info, newRawBytes, newOffsetsStruct }),
        signatureStripped: false,
      };
    case 'macho':
      return repackMacho({ buf, info, newRawBytes, newOffsetsStruct });
    case 'pe':
      return {
        buf: repackPe({ buf, info, newRawBytes, newOffsetsStruct }),
        signatureStripped: false,
      };
    default: {
      const _exhaustive: never = info.platform;
      throw new Error(`repackBinary: unhandled platform ${_exhaustive as string}`);
    }
  }
};
