/**
 * Unpack command - extract embedded modules from a Bun-compiled Claude Code binary.
 *
 * Replaces the AGENTS.md `npx tweakcc unpack` workflow with a built-in extractor
 * that does not depend on tweakcc/node-lief and survives Bun module-table format
 * changes (currently 36 vs 52-byte CompiledModuleGraphFile).
 */

import fs from 'node:fs';
import path from 'node:path';

import * as core from '../../core/index.js';
import { BunFormatError, extractAll, parseBunBinary } from '../../core/bun-extract.js';
import { expandTilde } from '../../core/paths.js';
import { loadVariantMeta } from '../../core/variants.js';
import type { ParsedArgs } from '../args.js';

export interface UnpackCommandOptions {
  opts: ParsedArgs;
}

const resolveBinaryPath = (target: string, rootDir: string): { binaryPath: string; label: string } => {
  // Variant name lookup first - matches `tweak <name>` semantics.
  const variantDir = path.join(rootDir, target);
  const meta = loadVariantMeta(variantDir);
  if (meta && fs.existsSync(meta.binaryPath)) {
    return { binaryPath: meta.binaryPath, label: target };
  }

  // Otherwise treat as a filesystem path.
  const expanded = expandTilde(target) ?? target;
  if (!fs.existsSync(expanded)) {
    throw new Error(`No variant or binary found at "${target}"`);
  }
  return { binaryPath: expanded, label: path.basename(expanded) };
};

export const runUnpackCommand = ({ opts }: UnpackCommandOptions): void => {
  const target = opts._?.[0];
  if (!target) {
    console.error('unpack requires a variant name or binary path');
    process.exit(1);
  }

  const rootDir = expandTilde((opts.root as string) || core.DEFAULT_ROOT) ?? core.DEFAULT_ROOT;
  const { binaryPath, label } = resolveBinaryPath(target, rootDir);

  const outOpt = typeof opts.out === 'string' ? opts.out : null;
  const outDir = outOpt ? (expandTilde(outOpt) ?? outOpt) : path.resolve(`extracted-${label}`);
  const includeSourcemaps = Boolean(opts['include-sourcemaps']);
  const writeManifest = opts.manifest !== false;

  const buf = fs.readFileSync(binaryPath);
  console.log(`Reading: ${binaryPath} (${(buf.length / 1024 / 1024).toFixed(1)} MB)`);

  let info;
  try {
    info = parseBunBinary(buf);
  } catch (err) {
    if (err instanceof BunFormatError) {
      console.error(`Failed to parse Bun binary: ${err.message}`);
      process.exit(1);
    }
    throw err;
  }

  const entryName = info.modules[info.entryPointId]?.name ?? '<unknown>';
  console.log(
    `Platform: ${info.platform}  ModuleSize: ${info.moduleSize} (${info.bunVersionHint})  Modules: ${info.modules.length}  Entry: ${entryName}`
  );
  if (info.platform === 'macho' && info.hasCodeSignature) {
    console.log('  (Mach-O code signature detected; in-place modifications would invalidate it.)');
  }

  const result = extractAll(buf, info, outDir, {
    writeSourcemaps: includeSourcemaps,
    manifest: writeManifest,
  });

  console.log(`\nWrote ${result.written.length} files to ${outDir}`);
  if (result.manifestPath) {
    console.log(`Manifest: ${result.manifestPath}`);
  }
};
