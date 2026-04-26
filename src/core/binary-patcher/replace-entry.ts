/**
 * Resize-capable replacement of the Bun entry-point module.
 *
 * Companion to bun-extract's same-size replaceModule. Used by the patcher
 * pipeline to swap in a modified cli.js whose length differs from the
 * original. Walks the module table once, shifts every StringPointer past
 * the entry's content end by the resize delta, rebuilds the Offsets struct,
 * then hands off to repackBinary for the platform container rewrite.
 *
 * Why entry-only: theme + prompt patches all live in the bundled cli.js,
 * which is the entry module. Generalising to arbitrary modules would force
 * us to re-sort the data slabs (each module's name/sourcemap/bytecode lives
 * adjacent to its content; resizing a non-entry module would shift slabs in
 * a way that the simple ">= cut" rule below cannot express).
 */

import { OFFSETS_SIZE } from '../bun-extract/constants.js';
import { BunFormatError, type BunBinaryInfo } from '../bun-extract.js';
import { repackBinary } from './repack.js';

export interface ReplaceEntryResult {
  buf: Buffer;
  signatureInvalidated: boolean;
  signatureStripped: boolean;
  delta: number;
}

export const replaceEntryJs = (buf: Buffer, info: BunBinaryInfo, newContent: Buffer): ReplaceEntryResult => {
  const entry = info.modules[info.entryPointId];
  if (!entry) {
    throw new BunFormatError(`Entry module id ${info.entryPointId} out of range (have ${info.modules.length} modules)`);
  }

  const oldEntryLen = entry.contLen;
  const newEntryLen = newContent.length;
  const delta = newEntryLen - oldEntryLen;
  const cut = entry.contOff + oldEntryLen;

  // Resolve old module-table position from the original Offsets struct.
  const offsetsStart = info.trailerOffset - OFFSETS_SIZE;
  const oldModulesOff = buf.readUInt32LE(offsetsStart + 8);
  const oldModulesLen = buf.readUInt32LE(offsetsStart + 12);

  // Build new rawBytes: bytes-before-entry + newContent + bytes-after-entry.
  const oldRawBytes = buf.subarray(info.dataStart, info.dataStart + info.byteCount);
  const newRawBytes = Buffer.concat([
    oldRawBytes.subarray(0, entry.contOff),
    newContent,
    oldRawBytes.subarray(entry.contOff + oldEntryLen),
  ]);

  // Module table offset within newRawBytes: shifts by delta if it sat past the cut.
  const newModulesOff = oldModulesOff >= cut ? oldModulesOff + delta : oldModulesOff;

  // Walk the module table and rewrite every StringPointer whose target is
  // at-or-past the cut by +=delta. The entry module's own content offset is
  // strictly less than cut (cut = entry.contOff + entry.contLen), so it
  // doesn't shift; we only update its length field.
  const moduleSize = info.moduleSize;
  for (let i = 0; i < info.modules.length; i += 1) {
    const base = newModulesOff + i * moduleSize;
    // Four StringPointers per module: name(0), content(8), sourcemap(16), bytecode(24).
    for (const slot of [0, 8, 16, 24]) {
      const ptrOff = newRawBytes.readUInt32LE(base + slot);
      const ptrLen = newRawBytes.readUInt32LE(base + slot + 4);
      if (ptrLen === 0) continue;
      if (ptrOff >= cut) {
        newRawBytes.writeUInt32LE(ptrOff + delta, base + slot);
      }
    }
    if (i === info.entryPointId) {
      newRawBytes.writeUInt32LE(newEntryLen, base + 8 + 4);
    }
  }

  // Build new Offsets struct. exec_argv (bytes 20..28) is opaque to us; copy through.
  const newOffsets = Buffer.alloc(OFFSETS_SIZE);
  newOffsets.writeBigUInt64LE(BigInt(newRawBytes.length), 0);
  newOffsets.writeUInt32LE(newModulesOff, 8);
  newOffsets.writeUInt32LE(oldModulesLen, 12);
  newOffsets.writeUInt32LE(info.entryPointId, 16);
  buf.copy(newOffsets, 20, offsetsStart + 20, offsetsStart + 28);
  newOffsets.writeUInt32LE(info.flags, 28);

  const repacked = repackBinary({ buf, info, newRawBytes, newOffsetsStruct: newOffsets });
  return {
    buf: repacked.buf,
    signatureInvalidated: info.platform === 'macho' && info.hasCodeSignature,
    signatureStripped: repacked.signatureStripped,
    delta,
  };
};
