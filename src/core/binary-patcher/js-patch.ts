/**
 * JS-side patcher for the unpack-and-run-via-node macOS path.
 *
 * Replaces the binary-level theme + prompt patching that runs against the
 * Bun-compiled cli.js inside the binary's __BUN section. Reads the unpacked
 * entry module, strips Bun's CJS wrapper so Node's loader can drive the file,
 * applies the same applyTheme + applyPrompts anchors used by the binary
 * patcher (they already operate on JS strings), and writes the patched body
 * back. Failures throw structured errors so the caller can map them to the
 * Phase 1 rollback path.
 */

import fs from 'node:fs';
import path from 'node:path';

import type { TweakccConfig } from '../../brands/types.js';
import type { OverlayKey, OverlayMap } from '../prompt-pack/types.js';

import { applyPrompts } from './prompts.js';
import { applyTheme } from './theme.js';
import { stripBunWrapper } from './strip-bun-wrapper.js';

interface ManifestModule {
  name: string;
  isEntry?: boolean;
}

interface UnpackedManifest {
  entryPoint?: string;
  modules?: ManifestModule[];
}

export class UnpackedManifestError extends Error {
  constructor(message: string) {
    super(`unpacked manifest: ${message}`);
    this.name = 'UnpackedManifestError';
  }
}

export interface PatchUnpackedResult {
  /** Absolute path of the entry module that was patched. */
  entryPath: string;
  /** Number of theme anchors successfully rewritten (3 on success, 0 if no themes). */
  themeReplaced: number;
  /** OverlayKeys for which a prompt anchor was applied. */
  promptReplaced: OverlayKey[];
  /** OverlayKeys for which an anchor was missing (silent no-op upstream). */
  promptMissing: OverlayKey[];
}

export const resolveEntryPath = (unpackedDir: string): string => {
  const manifestPath = path.join(unpackedDir, 'manifest.json');
  let manifest: UnpackedManifest;
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as UnpackedManifest;
  } catch (err) {
    throw new UnpackedManifestError(`read ${manifestPath}: ${(err as Error).message}`);
  }
  const entryName = manifest.entryPoint ?? manifest.modules?.find((m) => m.isEntry)?.name;
  if (!entryName) throw new UnpackedManifestError('no entry module in manifest');
  return path.join(unpackedDir, entryName);
};

/**
 * Read entry, strip wrapper, apply theme + prompts, write back. The file is
 * left in a Node-CJS-compatible shape (no Bun wrapper). Re-running this on
 * an already-patched directory is safe: stripBunWrapper round-trips on
 * already-stripped input, and applyPrompts replaces existing overlay blocks
 * rather than duplicating them.
 */
export const patchUnpackedEntry = ({
  unpackedDir,
  config,
  overlays,
}: {
  unpackedDir: string;
  config: TweakccConfig;
  overlays: OverlayMap | null;
}): PatchUnpackedResult => {
  const entryPath = resolveEntryPath(unpackedDir);

  // Read as latin1 so any non-UTF-8 byte values inside the bundled JS round-trip
  // safely. The bundler treats the entry as 8-bit clean (encoding: latin1 in
  // the manifest).
  const raw = fs.readFileSync(entryPath, 'latin1');
  const body = stripBunWrapper(raw);

  const themed = applyTheme(body, config.settings.themes);
  let js = themed.js;

  let promptReplaced: OverlayKey[] = [];
  let promptMissing: OverlayKey[] = [];
  if (overlays) {
    const result = applyPrompts(js, overlays);
    js = result.js;
    promptReplaced = result.replacedTargets;
    promptMissing = result.missing;
  }

  fs.writeFileSync(entryPath, js, 'latin1');

  return { entryPath, themeReplaced: themed.replaced, promptReplaced, promptMissing };
};
