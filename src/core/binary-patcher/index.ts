/**
 * In-repo binary patcher orchestrator.
 *
 * Reads a Bun-compiled Claude Code binary, runs theme + prompt patches over
 * the entry-module JS, repacks (with resize support), writes the result
 * back, and (on macOS) re-signs ad-hoc.
 *
 * Failure modes are returned as structured results, NOT thrown - the caller
 * (BinaryPatcherStep) inspects PatchResult.ok and triggers Phase 1 rollback
 * (restorePristineBinary + theme reset + meta.tweakRolledBack=true) when
 * ok is false.
 */

import fs from 'node:fs';

import type { TweakccConfig } from '../../brands/types.js';
import type { OverlayMap } from '../prompt-pack/types.js';

import { parseBunBinary, replaceModule } from '../bun-extract.js';
import { ThemeAnchorNotFound, applyTheme } from './theme.js';
import { applyPrompts } from './prompts.js';
import { replaceEntryJs } from './replace-entry.js';
import { tryAdhocSign } from './codesign.js';
import { PeNotLastSectionError } from './pe-resize.js';

export interface PatchInputs {
  binaryPath: string;
  config: TweakccConfig;
  overlays?: OverlayMap | null;
}

export type PatchFailureReason = 'anchor-not-found' | 'resize-bound-exceeded' | 'io-error';

export type PatchResult =
  | {
      ok: true;
      bytesChanged: number;
      resigned: boolean;
      missingPromptKeys: string[];
      /** When true on macOS, the binary is unsigned because codesign wasn't available. */
      codesignSkipped: boolean;
      /**
       * Set when the patch was deliberately skipped without modifying the
       * binary. Currently only fires on Mach-O when the patched JS would grow
       * past the original entry-module size (Mach-O segment shifting is not
       * implemented; see CLAUDE.local.md Phase 2 follow-ups).
       */
      skippedReason?: 'macho-grow-not-supported';
    }
  | {
      ok: false;
      reason: PatchFailureReason;
      detail: string;
    };

export const applyPatches = ({ binaryPath, config, overlays }: PatchInputs): PatchResult => {
  let buf: Buffer;
  try {
    buf = fs.readFileSync(binaryPath);
  } catch (err) {
    return { ok: false, reason: 'io-error', detail: `read ${binaryPath}: ${(err as Error).message}` };
  }

  const info = parseBunBinary(buf);
  const entry = info.modules[info.entryPointId];
  if (!entry) {
    return { ok: false, reason: 'io-error', detail: `entry module id ${info.entryPointId} out of range` };
  }
  const oldEntryLen = entry.contLen;
  const oldJs = buf
    .subarray(info.dataStart + entry.contOff, info.dataStart + entry.contOff + oldEntryLen)
    .toString('utf8');

  // Theme patch first - anchor failure here aborts the whole patch (we don't
  // ship a theme-less variant; rollback will restore pristine).
  let newJs = oldJs;
  try {
    const themed = applyTheme(newJs, config.settings.themes);
    newJs = themed.js;
  } catch (err) {
    if (err instanceof ThemeAnchorNotFound) {
      return { ok: false, reason: 'anchor-not-found', detail: err.message };
    }
    return { ok: false, reason: 'io-error', detail: `applyTheme: ${(err as Error).message}` };
  }

  // Prompt overlays are best-effort - keys whose anchor is missing are
  // recorded but don't abort. This matches today's silent no-op behaviour
  // for prompt keys whose extracted .md file was absent.
  let missingPromptKeys: string[] = [];
  if (overlays) {
    const promptResult = applyPrompts(newJs, overlays);
    newJs = promptResult.js;
    missingPromptKeys = promptResult.missing;
  }

  // Mach-O resize is intentionally restricted: changing __BUN's size shifts
  // every downstream segment (__DATA, __LINKEDIT, codesig blob), and that
  // bookkeeping is out of scope for this patcher. Workaround: keep the entry
  // module the SAME size by padding shrinks with trailing whitespace, and
  // SKIP the patch (binary stays pristine + functional, no theme) when we'd
  // grow. The skip is reported via skippedReason so the build step can
  // surface a note instead of triggering a rollback. ELF and PE resize fine.
  let bytesChanged = 0;
  let writeBuf: Buffer | null = null;
  let skippedReason: 'macho-grow-not-supported' | undefined;
  if (info.platform === 'macho') {
    const delta = newJs.length - oldEntryLen;
    if (delta > 0) {
      skippedReason = 'macho-grow-not-supported';
    } else {
      if (delta < 0) {
        newJs = newJs + ' '.repeat(-delta);
      }
      try {
        const sized = replaceModule(buf, info, entry.name, Buffer.from(newJs, 'utf8'));
        writeBuf = sized.buf;
      } catch (err) {
        return { ok: false, reason: 'io-error', detail: `replaceModule: ${(err as Error).message}` };
      }
    }
  } else {
    try {
      const result = replaceEntryJs(buf, info, Buffer.from(newJs, 'utf8'));
      writeBuf = result.buf;
      bytesChanged = result.delta;
    } catch (err) {
      if (err instanceof PeNotLastSectionError) {
        return { ok: false, reason: 'resize-bound-exceeded', detail: err.message };
      }
      return { ok: false, reason: 'io-error', detail: `replaceEntryJs: ${(err as Error).message}` };
    }
  }

  let resigned = false;
  let codesignSkipped = false;

  if (writeBuf) {
    try {
      fs.writeFileSync(binaryPath, writeBuf);
      if (process.platform !== 'win32') {
        fs.chmodSync(binaryPath, 0o755);
      }
    } catch (err) {
      return { ok: false, reason: 'io-error', detail: `write ${binaryPath}: ${(err as Error).message}` };
    }

    // Re-sign on macOS whenever the original had a signature - any byte change
    // invalidates Apple's hash, so codesign --force --sign - replaces it with
    // an ad-hoc one. AMFI on Apple Silicon kills binaries whose signature
    // doesn't verify, so re-signing is mandatory for the patched binary to
    // launch. Both failure modes (no codesign in PATH, or codesign rejected)
    // downgrade to a soft codesignSkipped warning; smokeTestBinary in the
    // build step catches anything that genuinely can't launch.
    if (info.platform === 'macho' && info.hasCodeSignature) {
      const sign = tryAdhocSign(binaryPath);
      if (sign.signed) {
        resigned = true;
      } else {
        codesignSkipped = true;
      }
    }
  }

  return {
    ok: true,
    bytesChanged,
    resigned,
    missingPromptKeys,
    codesignSkipped,
    skippedReason,
  };
};
