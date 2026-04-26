/**
 * Bun standalone-binary extractor.
 *
 * Parses Mach-O __BUN, ELF appended-trailer, and PE .bun section layouts to
 * recover the embedded StandaloneModuleGraph (source modules, sourcemaps,
 * bytecode caches) without relying on tweakcc / node-lief.
 *
 * Same-size in-place module replacement is supported via replaceModule.
 * Resizing the entry-point module is owned by src/core/binary-patcher
 * (replaceEntryJs), which uses parseBunBinary's output and the constants
 * exported from this file to rewrite the module table and platform headers.
 */

import fs from 'node:fs';
import path from 'node:path';

import {
  BUNFS_PATH_PREFIXES,
  ENCODING_NAMES,
  FLAG_OFFSETS_BY_SIZE,
  FORMAT_NAMES,
  LOADER_NAMES,
  MODULE_SIZES,
  MODULE_SIZE_V52,
  OFFSETS_SIZE,
  TRAILER,
  TRAILER_SEARCH_WINDOW,
  type Encoding,
  type LoaderKind,
  type ModuleFormat,
  type ModuleSize,
  type Side,
} from './bun-extract/constants.js';
import { elfDataStart, isElf } from './bun-extract/elf.js';
import { findBunSection, isMacho, machoDataStart } from './bun-extract/macho.js';
import { findBunPeSection, isPe, peDataStart } from './bun-extract/pe.js';

export type BunPlatform = 'macho' | 'elf' | 'pe';

export interface BunModule {
  index: number;
  name: string;
  contOff: number;
  contLen: number;
  smapOff: number;
  smapLen: number;
  bcOff: number;
  bcLen: number;
  encoding: Encoding | number;
  loader: LoaderKind | number;
  format: ModuleFormat | number;
  side: Side;
  isEntry: boolean;
}

export interface BunBinaryInfo {
  platform: BunPlatform;
  dataStart: number;
  trailerOffset: number;
  byteCount: number;
  moduleSize: ModuleSize;
  modules: BunModule[];
  entryPointId: number;
  flags: number;
  sectionOffset?: number;
  sectionSize?: number;
  hasCodeSignature: boolean;
  bunVersionHint: 'pre-1.3.13' | '>=1.3.13';
}

export interface ExtractAllOptions {
  writeSourcemaps?: boolean;
  manifest?: boolean;
}

export interface ExtractAllResult {
  written: string[];
  manifestPath?: string;
}

export interface ReplaceResult {
  buf: Buffer;
  signatureInvalidated: boolean;
}

export class BunFormatError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BunFormatError';
  }
}

export class ModuleNotFound extends Error {
  constructor(moduleName: string) {
    super(`Module not found in Bun binary: ${moduleName}`);
    this.name = 'ModuleNotFound';
  }
}

export class SizeMismatch extends Error {
  constructor(moduleName: string, expected: number, actual: number) {
    super(
      `replaceModule requires same-size content for "${moduleName}". Expected ${expected} bytes, got ${actual}. Resizing replacements would shift downstream offsets and require module-table rebuilds (out of scope).`
    );
    this.name = 'SizeMismatch';
  }
}

export const parseBunBinary = (buf: Buffer): BunBinaryInfo => {
  const trailerOffset = findTrailer(buf);
  if (trailerOffset < 0) {
    throw new BunFormatError(`Bun trailer "\\n---- Bun! ----\\n" not found in last ${TRAILER_SEARCH_WINDOW} bytes`);
  }

  const offsetsStart = trailerOffset - OFFSETS_SIZE;
  if (offsetsStart < 0) {
    throw new BunFormatError(`Trailer at offset ${trailerOffset} leaves no room for Offsets struct`);
  }

  const byteCount = Number(buf.readBigUInt64LE(offsetsStart));
  const modulesOff = buf.readUInt32LE(offsetsStart + 8);
  const modulesLen = buf.readUInt32LE(offsetsStart + 12);
  const entryPointId = buf.readUInt32LE(offsetsStart + 16);
  const flags = buf.readUInt32LE(offsetsStart + 28);

  // Resolve platform + dataStart.
  let platform: BunPlatform;
  let dataStart: number;
  let sectionOffset: number | undefined;
  let sectionSize: number | undefined;
  let hasCodeSignature = false;

  if (isMacho(buf)) {
    platform = 'macho';
    const section = findBunSection(buf);
    if (section) {
      sectionOffset = section.sectionOffset;
      sectionSize = section.sectionSize;
      hasCodeSignature = section.hasCodeSignature;
      dataStart = machoDataStart(section.sectionOffset);
    } else {
      // Fall back to trailer-derived computation if section scan failed.
      dataStart = elfDataStart(trailerOffset, byteCount);
    }
  } else if (isPe(buf)) {
    platform = 'pe';
    const section = findBunPeSection(buf);
    if (section) {
      sectionOffset = section.pointerToRawData;
      sectionSize = section.sizeOfRawData;
      dataStart = peDataStart(section.pointerToRawData);
    } else {
      dataStart = elfDataStart(trailerOffset, byteCount);
    }
  } else if (isElf(buf)) {
    platform = 'elf';
    dataStart = elfDataStart(trailerOffset, byteCount);
  } else {
    // Unknown header but still has a Bun trailer: treat as ELF-style appended data.
    platform = 'elf';
    dataStart = elfDataStart(trailerOffset, byteCount);
  }

  if (dataStart < 0 || dataStart + byteCount > buf.length) {
    throw new BunFormatError(
      `Computed dataStart=${dataStart} byteCount=${byteCount} is out of range for binary of length ${buf.length}`
    );
  }

  // Try each known module struct size, validating against the data we just located.
  let result: { moduleSize: ModuleSize; modules: BunModule[] } | null = null;
  const errors: string[] = [];
  for (const candidate of MODULE_SIZES) {
    if (modulesLen % candidate !== 0) {
      errors.push(`size=${candidate}: modulesLen=${modulesLen} not divisible`);
      continue;
    }
    try {
      const modules = readModuleTable(buf, dataStart, modulesOff, modulesLen, candidate, entryPointId, byteCount);
      result = { moduleSize: candidate, modules };
      break;
    } catch (err) {
      errors.push(`size=${candidate}: ${(err as Error).message}`);
    }
  }

  if (!result) {
    throw new BunFormatError(`Could not parse module table at any known struct size. Attempts: ${errors.join('; ')}`);
  }

  return {
    platform,
    dataStart,
    trailerOffset,
    byteCount,
    moduleSize: result.moduleSize,
    modules: result.modules,
    entryPointId,
    flags,
    sectionOffset,
    sectionSize,
    hasCodeSignature,
    bunVersionHint: result.moduleSize === MODULE_SIZE_V52 ? '>=1.3.13' : 'pre-1.3.13',
  };
};

const findTrailer = (buf: Buffer): number => {
  const minStart = Math.max(0, buf.length - TRAILER_SEARCH_WINDOW);
  for (let i = buf.length - TRAILER.length; i >= minStart; i -= 1) {
    if (buf[i] === TRAILER[0] && buf.subarray(i, i + TRAILER.length).equals(TRAILER)) {
      return i;
    }
  }
  return -1;
};

const readModuleTable = (
  buf: Buffer,
  dataStart: number,
  modulesOff: number,
  modulesLen: number,
  moduleSize: ModuleSize,
  entryPointId: number,
  byteCount: number
): BunModule[] => {
  const numModules = modulesLen / moduleSize;
  const flagsBase = FLAG_OFFSETS_BY_SIZE[moduleSize];
  const modules: BunModule[] = [];

  for (let i = 0; i < numModules; i += 1) {
    const base = dataStart + modulesOff + i * moduleSize;
    if (base + moduleSize > buf.length) {
      throw new Error(`module ${i} extends past EOF`);
    }

    const nameOff = buf.readUInt32LE(base);
    const nameLen = buf.readUInt32LE(base + 4);
    const contOff = buf.readUInt32LE(base + 8);
    const contLen = buf.readUInt32LE(base + 12);
    const smapOff = buf.readUInt32LE(base + 16);
    const smapLen = buf.readUInt32LE(base + 20);
    const bcOff = buf.readUInt32LE(base + 24);
    const bcLen = buf.readUInt32LE(base + 28);

    if (nameLen === 0 || nameLen > 4096) {
      throw new Error(`module ${i} has implausible nameLen=${nameLen}`);
    }
    if (nameOff + nameLen > byteCount) {
      throw new Error(`module ${i} name extends past byteCount`);
    }
    if (contOff + contLen > byteCount) {
      throw new Error(`module ${i} content extends past byteCount`);
    }

    const nameBytes = buf.subarray(dataStart + nameOff, dataStart + nameOff + nameLen);
    if (!isPlausibleNameBytes(nameBytes)) {
      throw new Error(`module ${i} name is not a plausible path`);
    }

    const encByte = buf[base + flagsBase];
    const loaderByte = buf[base + flagsBase + 1];
    const formatByte = buf[base + flagsBase + 2];
    const sideByte = buf[base + flagsBase + 3];

    modules.push({
      index: i,
      name: stripBunfs(nameBytes.toString('utf8')),
      contOff,
      contLen,
      smapOff,
      smapLen,
      bcOff,
      bcLen,
      encoding: ENCODING_NAMES[encByte] ?? encByte,
      loader: LOADER_NAMES[loaderByte] ?? loaderByte,
      format: FORMAT_NAMES[formatByte] ?? formatByte,
      side: sideByte === 1 ? 'client' : 'server',
      isEntry: i === entryPointId,
    });
  }

  return modules;
};

const stripBunfs = (raw: string): string => {
  for (const prefix of BUNFS_PATH_PREFIXES) {
    if (raw.startsWith(prefix)) return raw.slice(prefix.length);
  }
  return raw;
};

const isPlausibleNameBytes = (bytes: Buffer): boolean => {
  if (bytes.length === 0) return false;
  for (let i = 0; i < bytes.length; i += 1) {
    const b = bytes[i];
    // Allow printable ASCII, plus common UTF-8 continuation/lead bytes for non-ASCII paths.
    if (b === 0) return false;
    if (b < 0x20 && b !== 0x09) return false;
    if (b === 0x7f) return false;
  }
  return true;
};

export const extractAll = (
  buf: Buffer,
  info: BunBinaryInfo,
  outDir: string,
  opts: ExtractAllOptions = {}
): ExtractAllResult => {
  const written: string[] = [];
  fs.mkdirSync(outDir, { recursive: true });

  for (const mod of info.modules) {
    if (mod.contLen === 0) continue;
    const outPath = path.join(outDir, sanitizeRelPath(mod.name));
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    const slice = buf.subarray(info.dataStart + mod.contOff, info.dataStart + mod.contOff + mod.contLen);
    fs.writeFileSync(outPath, slice);
    written.push(outPath);

    if (opts.writeSourcemaps && mod.smapLen > 0) {
      const smap = buf.subarray(info.dataStart + mod.smapOff, info.dataStart + mod.smapOff + mod.smapLen);
      const smapPath = `${outPath}.map`;
      fs.writeFileSync(smapPath, smap);
      written.push(smapPath);
    }
  }

  let manifestPath: string | undefined;
  if (opts.manifest !== false) {
    manifestPath = path.join(outDir, 'manifest.json');
    fs.writeFileSync(
      manifestPath,
      JSON.stringify(
        {
          platform: info.platform,
          moduleSize: info.moduleSize,
          bunVersionHint: info.bunVersionHint,
          entryPoint: info.modules[info.entryPointId]?.name,
          entryPointId: info.entryPointId,
          flags: info.flags,
          modules: info.modules.map((m) => ({
            index: m.index,
            name: m.name,
            sourceSize: m.contLen,
            bytecodeSize: m.bcLen,
            sourcemapSize: m.smapLen,
            isEntry: m.isEntry,
            encoding: m.encoding,
            loader: m.loader,
            format: m.format,
            side: m.side,
          })),
        },
        null,
        2
      )
    );
  }

  return { written, manifestPath };
};

// Block path traversal via .. segments and absolute paths. Bun's $bunfs/root paths
// shouldn't contain these post-strip, but defense-in-depth keeps unpack safe on
// tampered binaries.
const sanitizeRelPath = (rel: string): string => {
  const normalized = rel.replace(/\\/g, '/');
  const stripped = normalized.replace(/^\/+/, '');
  if (stripped.split('/').some((seg) => seg === '..')) {
    throw new BunFormatError(`Refusing to extract module with traversal path: ${rel}`);
  }
  return stripped;
};

export const replaceModule = (
  buf: Buffer,
  info: BunBinaryInfo,
  moduleName: string,
  newContent: Buffer
): ReplaceResult => {
  const target = info.modules.find((m) => m.name === moduleName);
  if (!target) throw new ModuleNotFound(moduleName);
  if (newContent.length !== target.contLen) {
    throw new SizeMismatch(moduleName, target.contLen, newContent.length);
  }
  const out = Buffer.from(buf);
  newContent.copy(out, info.dataStart + target.contOff);
  return {
    buf: out,
    signatureInvalidated: info.platform === 'macho' && info.hasCodeSignature,
  };
};
