/**
 * Bun standalone-binary format constants.
 *
 * Format reference: https://github.com/oven-sh/bun src/StandaloneModuleGraph.zig
 *
 * Layout (per platform):
 *   macOS  - __BUN section in a Mach-O segment, 8-byte u64 size header at section start.
 *   Linux  - data appended to ELF binary, no section header.
 *   Windows- .bun PE section, no 8-byte size header.
 *
 * All platforms end with [Offsets struct (32 bytes)][trailer "\n---- Bun! ----\n"].
 */

export const TRAILER = Buffer.from('\n---- Bun! ----\n');

/** Size of the Offsets struct that precedes the trailer. */
export const OFFSETS_SIZE = 32;

/** Mach-O section header has an 8-byte u64 LE size prefix; PE/ELF don't. */
export const MACHO_SECTION_HEADER_SIZE = 8;

/**
 * Compiled module struct sizes by Bun version.
 *
 * Both layouts share the first 32 bytes (4 StringPointer pairs:
 * name, content, sourcemap, bytecode).
 *
 *   v36 (pre-1.3.13): 32 bytes of pointers + 4 bytes of flags.
 *   v52 (>=1.3.13):   32 bytes of pointers + 16 bytes of extra pointers
 *                     (module_info, bytecode_origin_path) + 4 bytes of flags.
 */
export const MODULE_SIZE_V36 = 36;
export const MODULE_SIZE_V52 = 52;

export type ModuleSize = typeof MODULE_SIZE_V36 | typeof MODULE_SIZE_V52;

export const MODULE_SIZES: ModuleSize[] = [MODULE_SIZE_V52, MODULE_SIZE_V36];

/** Flag byte offsets (encoding/loader/format/side) within the module struct. */
export const FLAG_OFFSETS_BY_SIZE: Record<ModuleSize, number> = {
  [MODULE_SIZE_V36]: 32,
  [MODULE_SIZE_V52]: 48,
};

/** Backward search window for the trailer; skips macOS code-signature padding. */
export const TRAILER_SEARCH_WINDOW = 4 * 1024 * 1024;

/** Cap on first-bytes scan when locating the Mach-O __BUN section heuristically. */
export const MACHO_HEADER_SCAN_BYTES = 8192;

/** Mach-O magic bytes (LE). */
export const MACHO_MAGIC_64 = 0xfeedfacf;
export const MACHO_MAGIC_64_BE = 0xcffaedfe;
export const MACHO_MAGIC_FAT = 0xcafebabe;
export const MACHO_MAGIC_FAT_LE = 0xbebafeca;

/** ELF magic: 0x7F 'E' 'L' 'F'. */
export const ELF_MAGIC_BYTES = Buffer.from([0x7f, 0x45, 0x4c, 0x46]);

/** PE: 'MZ' DOS header magic. */
export const PE_DOS_MAGIC = 0x5a4d; // 'MZ' little-endian read as u16
export const PE_NT_SIGNATURE = 0x00004550; // 'PE\0\0'

export type Encoding = 'binary' | 'latin1' | 'utf8';
export type ModuleFormat = 'none' | 'esm' | 'cjs';
export type Side = 'server' | 'client';
export type LoaderKind = 'file' | 'js' | 'wasm' | 'napi';

export const ENCODING_NAMES: Record<number, Encoding> = {
  0: 'binary',
  1: 'latin1',
  2: 'utf8',
};

export const FORMAT_NAMES: Record<number, ModuleFormat> = {
  0: 'none',
  1: 'esm',
  2: 'cjs',
};

export const LOADER_NAMES: Record<number, LoaderKind> = {
  0: 'file',
  1: 'js',
  9: 'wasm',
  10: 'napi',
};

export const BUNFS_PATH_PREFIXES = ['/$bunfs/root/', '$bunfs/root/'];
