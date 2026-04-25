import { ELF_MAGIC_BYTES, OFFSETS_SIZE } from './constants.js';

export const isElf = (buf: Buffer): boolean =>
  buf.length >= ELF_MAGIC_BYTES.length && buf.subarray(0, ELF_MAGIC_BYTES.length).equals(ELF_MAGIC_BYTES);

/**
 * For ELF binaries, Bun appends [data][module table][Offsets][trailer] at EOF.
 *
 * StringPointer offsets in the module table are relative to the start of the
 * raw_bytes region that Bun's runtime passes to StandaloneModuleGraph.fromBytes.
 * That region is [data .. module table .. Offsets struct .. trailer], so its
 * total size is byteCount + OFFSETS_SIZE + trailer.length.
 *
 * byteCount in the Offsets struct excludes the Offsets struct and the trailer
 * (per StandaloneModuleGraph.zig: "the length of the module graph with padding,
 * excluding the trailer and offsets").
 *
 * Therefore the start of raw_bytes is:
 *   trailerOffset - byteCount - OFFSETS_SIZE
 *
 * The previous formula `trailerOffset + trailerLen - byteCount` lands
 * `OFFSETS_SIZE + trailer.length` (48) bytes past the real start, which is why
 * names came back as random JS slices on Linux ELF binaries.
 */
export const elfDataStart = (trailerOffset: number, byteCount: number): number =>
  trailerOffset - byteCount - OFFSETS_SIZE;
