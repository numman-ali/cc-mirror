import { spawnSync } from 'node:child_process';
import { isWindows } from './paths.js';

export type WindowsPathStatus = 'updated' | 'skipped' | 'failed';

export interface WindowsPathResult {
  status: WindowsPathStatus;
  message: string;
}

const quoteForPowerShell = (value: string): string => value.replace(/'/g, "''");

export const ensureWindowsUserPath = (binDir: string): WindowsPathResult => {
  if (!isWindows) {
    return { status: 'skipped', message: 'Not running on Windows' };
  }
  if (process.env.CC_MIRROR_DISABLE_PATH_UPDATE === '1' || process.env.CI === 'true') {
    return { status: 'skipped', message: 'Windows PATH update disabled for this process' };
  }

  const normalizedBin = (binDir ?? '').trim();
  if (!normalizedBin) {
    return { status: 'failed', message: 'Bin directory is empty' };
  }

  const psScript = [
    `$bin = '${quoteForPowerShell(normalizedBin)}'`,
    '$normalize = {',
    '  param([string]$v)',
    "  if ($null -eq $v) { return '' }",
    "  return $v.Trim().Trim('\"').TrimEnd('\\', '/').ToLowerInvariant()",
    '}',
    "$userPath = [Environment]::GetEnvironmentVariable('Path', 'User')",
    '$segments = @()',
    "if ($userPath) { $segments = $userPath -split ';' | Where-Object { $_ -and $_.Trim() -ne '' } }",
    '$needle = & $normalize $bin',
    '$exists = $false',
    'foreach ($entry in $segments) {',
    '  if ((& $normalize $entry) -eq $needle) {',
    '    $exists = $true',
    '    break',
    '  }',
    '}',
    "if ($exists) { Write-Output 'already'; exit 0 }",
    "$nextPath = if ([string]::IsNullOrWhiteSpace($userPath)) { $bin } else { $userPath.TrimEnd(';') + ';' + $bin }",
    "[Environment]::SetEnvironmentVariable('Path', $nextPath, 'User')",
    "Write-Output 'updated'",
  ].join('; ');

  const result = spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', psScript], {
    encoding: 'utf8',
  });

  if (result.status !== 0) {
    const message = result.stderr?.trim() || result.stdout?.trim() || 'unknown failure';
    return { status: 'failed', message };
  }

  const output = result.stdout?.trim().toLowerCase() || '';
  if (output.includes('updated')) {
    return {
      status: 'updated',
      message: `Added ${normalizedBin} to user PATH. Open a new terminal to pick up the change.`,
    };
  }

  return { status: 'skipped', message: `User PATH already includes ${normalizedBin}` };
};
