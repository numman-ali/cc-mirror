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

import { parseBunBinary } from '../bun-extract.js';
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

export type PatchFailureReason = 'anchor-not-found' | 'resize-bound-exceeded' | 'codesign-failed' | 'io-error';

export type PatchResult =
  | {
      ok: true;
      bytesChanged: number;
      resigned: boolean;
      missingPromptKeys: string[];
      /** When true on macOS, the binary is unsigned because codesign wasn't available. */
      codesignSkipped: boolean;
    }
  | {
      ok: false;
      reason: PatchFailureReason;
      detail: string;
    };

export const applyPatches = async ({ binaryPath, config, overlays }: PatchInputs): Promise<PatchResult> => {
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

  // Repack with resize support.
  let repacked: { buf: Buffer; signatureStripped: boolean };
  try {
    const result = replaceEntryJs(buf, info, Buffer.from(newJs, 'utf8'));
    repacked = { buf: result.buf, signatureStripped: result.signatureStripped };
  } catch (err) {
    if (err instanceof PeNotLastSectionError) {
      return { ok: false, reason: 'resize-bound-exceeded', detail: err.message };
    }
    return { ok: false, reason: 'io-error', detail: `replaceEntryJs: ${(err as Error).message}` };
  }

  try {
    fs.writeFileSync(binaryPath, repacked.buf);
    if (process.platform !== 'win32') {
      fs.chmodSync(binaryPath, 0o755);
    }
  } catch (err) {
    return { ok: false, reason: 'io-error', detail: `write ${binaryPath}: ${(err as Error).message}` };
  }

  // Re-sign on macOS only when we actually stripped a signature - otherwise
  // codesign --force would create an ad-hoc signature where Apple's was, which
  // is fine but unnecessary. Returning codesign-failed lets the caller decide
  // (typically: rollback). codesign-missing is a soft warning that surfaces
  // via codesignSkipped.
  let resigned = false;
  let codesignSkipped = false;
  if (info.platform === 'macho' && repacked.signatureStripped) {
    const sign = tryAdhocSign(binaryPath);
    if (sign.signed) {
      resigned = true;
    } else if (sign.reason === 'failed') {
      return { ok: false, reason: 'codesign-failed', detail: sign.detail ?? 'codesign failed' };
    } else {
      codesignSkipped = true;
    }
  }

  return {
    ok: true,
    bytesChanged: repacked.buf.length - buf.length,
    resigned,
    missingPromptKeys,
    codesignSkipped,
  };
};
