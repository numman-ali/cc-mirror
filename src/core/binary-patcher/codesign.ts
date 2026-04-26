/**
 * Ad-hoc macOS code-signing helper.
 *
 * Used after a Mach-O patch invalidates the Apple-issued signature: we strip
 * the LC_CODE_SIGNATURE in repackMacho, then run `codesign --force --sign -`
 * here to reapply an ad-hoc signature so AMFI on Apple Silicon doesn't kill
 * the binary. If `codesign` isn't available (CI without Xcode CLT), we leave
 * the binary unsigned and let the orchestrator surface a soft warning - the
 * smoke test catches anything actually broken.
 */

import { spawnSync } from 'node:child_process';

export interface AdhocSignResult {
  signed: boolean;
  /** Why we didn't sign, when signed === false. */
  reason?: 'no-codesign' | 'failed';
  detail?: string;
}

const isCodesignMissingError = (err: NodeJS.ErrnoException | undefined): boolean => {
  if (!err) return false;
  return err.code === 'ENOENT';
};

export const tryAdhocSign = (binaryPath: string): AdhocSignResult => {
  if (process.platform !== 'darwin') {
    // Other platforms don't need ad-hoc signing.
    return { signed: false, reason: 'no-codesign', detail: `not darwin (process.platform=${process.platform})` };
  }

  let result: ReturnType<typeof spawnSync>;
  try {
    result = spawnSync('codesign', ['--force', '--sign', '-', binaryPath], {
      encoding: 'utf8',
      windowsHide: true,
    });
  } catch (err) {
    if (isCodesignMissingError(err as NodeJS.ErrnoException)) {
      return { signed: false, reason: 'no-codesign', detail: 'codesign binary not found in PATH' };
    }
    return { signed: false, reason: 'failed', detail: (err as Error).message };
  }

  if (result.error && isCodesignMissingError(result.error as NodeJS.ErrnoException)) {
    return { signed: false, reason: 'no-codesign', detail: 'codesign binary not found in PATH' };
  }
  if (result.error) {
    return { signed: false, reason: 'failed', detail: result.error.message };
  }
  if (result.status !== 0) {
    const stderrRaw = result.stderr;
    const stderr = (typeof stderrRaw === 'string' ? stderrRaw : (stderrRaw?.toString('utf8') ?? '')).trim();
    return {
      signed: false,
      reason: 'failed',
      detail: `codesign exited ${result.status}${stderr ? `: ${stderr}` : ''}`,
    };
  }
  return { signed: true };
};
