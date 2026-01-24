import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { commandExists } from './paths.js';

export type SkillInstallStatus = 'installed' | 'updated' | 'skipped' | 'failed';

export interface SkillInstallResult {
  status: SkillInstallStatus;
  message?: string;
  path?: string;
}

const DEV_BROWSER_REPO = 'https://github.com/SawyerHood/dev-browser.git';
const DEV_BROWSER_ARCHIVE = 'https://github.com/SawyerHood/dev-browser/archive/refs/heads/main.tar.gz';
const SKILL_SUBDIR = path.join('skills', 'dev-browser');
const MANAGED_MARKER = '.cc-mirror-managed';

const ensureDir = (dir: string) => {
  fs.mkdirSync(dir, { recursive: true });
};

const copyDir = (source: string, target: string) => {
  fs.cpSync(source, target, { recursive: true });
};

const resolveSkillSourceDir = (repoDir: string): string | null => {
  const direct = path.join(repoDir, SKILL_SUBDIR);
  if (fs.existsSync(direct)) return direct;
  const nested = fs.readdirSync(repoDir).find((entry) => entry.startsWith('dev-browser-'));
  if (nested) {
    const candidate = path.join(repoDir, nested, SKILL_SUBDIR);
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
};

const cloneRepo = (targetDir: string): { ok: boolean; message?: string } => {
  if (!commandExists('git')) return { ok: false, message: 'git not found' };
  const result = spawnSync('git', ['clone', '--depth', '1', DEV_BROWSER_REPO, targetDir], {
    encoding: 'utf8',
  });
  if (result.status === 0) return { ok: true };
  return { ok: false, message: result.stderr?.trim() || result.stdout?.trim() || 'git clone failed' };
};

const downloadArchive = (targetDir: string): { ok: boolean; message?: string } => {
  if (!commandExists('curl') || !commandExists('tar')) {
    return { ok: false, message: 'curl or tar not found' };
  }
  const archivePath = path.join(targetDir, 'dev-browser.tar.gz');
  const curlResult = spawnSync('curl', ['-L', '-o', archivePath, DEV_BROWSER_ARCHIVE], { encoding: 'utf8' });
  if (curlResult.status !== 0) {
    return { ok: false, message: curlResult.stderr?.trim() || 'curl failed' };
  }
  const tarResult = spawnSync('tar', ['-xzf', archivePath, '-C', targetDir], { encoding: 'utf8' });
  if (tarResult.status !== 0) {
    return { ok: false, message: tarResult.stderr?.trim() || 'tar extract failed' };
  }
  return { ok: true };
};

export const ensureDevBrowserSkill = (opts: {
  install: boolean;
  update?: boolean;
  targetDir?: string;
}): SkillInstallResult => {
  if (!opts.install) {
    return { status: 'skipped', message: 'skill install disabled' };
  }

  const skillRoot = opts.targetDir || path.join(os.homedir(), '.claude', 'skills');
  const targetDir = path.join(skillRoot, 'dev-browser');
  const markerPath = path.join(targetDir, MANAGED_MARKER);
  const exists = fs.existsSync(targetDir);
  const managed = exists && fs.existsSync(markerPath);

  if (exists && !managed && !opts.update) {
    return { status: 'skipped', message: 'existing skill is user-managed', path: targetDir };
  }

  ensureDir(skillRoot);

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-mirror-skill-'));
  try {
    let fetchResult = cloneRepo(tmpDir);
    if (!fetchResult.ok) {
      fetchResult = downloadArchive(tmpDir);
    }
    if (!fetchResult.ok) {
      return { status: 'failed', message: fetchResult.message || 'skill fetch failed' };
    }

    const sourceDir = resolveSkillSourceDir(tmpDir);
    if (!sourceDir) {
      return { status: 'failed', message: 'skill source not found after download' };
    }

    if (exists) {
      fs.rmSync(targetDir, { recursive: true, force: true });
    }
    copyDir(sourceDir, targetDir);
    fs.writeFileSync(
      markerPath,
      JSON.stringify({ managedBy: 'cc-mirror', updatedAt: new Date().toISOString() }, null, 2)
    );
    return { status: exists ? 'updated' : 'installed', path: targetDir };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { status: 'failed', message };
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
};

// Async versions for TUI progress updates

const spawnAsync = (cmd: string, args: string[]): Promise<{ ok: boolean; message?: string }> => {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { stdio: 'pipe' });
    let stderr = '';
    let stdout = '';
    child.stdout?.on('data', (d) => {
      stdout += d.toString();
    });
    child.stderr?.on('data', (d) => {
      stderr += d.toString();
    });
    child.on('close', (code) => {
      if (code === 0) resolve({ ok: true });
      else resolve({ ok: false, message: stderr.trim() || stdout.trim() || `${cmd} failed` });
    });
    child.on('error', (err) => resolve({ ok: false, message: err.message }));
  });
};

const cloneRepoAsync = async (targetDir: string): Promise<{ ok: boolean; message?: string }> => {
  if (!commandExists('git')) return { ok: false, message: 'git not found' };
  return spawnAsync('git', ['clone', '--depth', '1', DEV_BROWSER_REPO, targetDir]);
};

const downloadArchiveAsync = async (targetDir: string): Promise<{ ok: boolean; message?: string }> => {
  if (!commandExists('curl') || !commandExists('tar')) {
    return { ok: false, message: 'curl or tar not found' };
  }
  const archivePath = path.join(targetDir, 'dev-browser.tar.gz');
  const curlResult = await spawnAsync('curl', ['-L', '-o', archivePath, DEV_BROWSER_ARCHIVE]);
  if (!curlResult.ok) return curlResult;
  return spawnAsync('tar', ['-xzf', archivePath, '-C', targetDir]);
};

export const ensureDevBrowserSkillAsync = async (opts: {
  install: boolean;
  update?: boolean;
  targetDir?: string;
}): Promise<SkillInstallResult> => {
  if (!opts.install) {
    return { status: 'skipped', message: 'skill install disabled' };
  }

  const skillRoot = opts.targetDir || path.join(os.homedir(), '.claude', 'skills');
  const targetDir = path.join(skillRoot, 'dev-browser');
  const markerPath = path.join(targetDir, MANAGED_MARKER);
  const exists = fs.existsSync(targetDir);
  const managed = exists && fs.existsSync(markerPath);

  if (exists && !managed && !opts.update) {
    return { status: 'skipped', message: 'existing skill is user-managed', path: targetDir };
  }

  ensureDir(skillRoot);

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-mirror-skill-'));
  try {
    let fetchResult = await cloneRepoAsync(tmpDir);
    if (!fetchResult.ok) {
      fetchResult = await downloadArchiveAsync(tmpDir);
    }
    if (!fetchResult.ok) {
      return { status: 'failed', message: fetchResult.message || 'skill fetch failed' };
    }

    const sourceDir = resolveSkillSourceDir(tmpDir);
    if (!sourceDir) {
      return { status: 'failed', message: 'skill source not found after download' };
    }

    if (exists) {
      fs.rmSync(targetDir, { recursive: true, force: true });
    }
    copyDir(sourceDir, targetDir);
    fs.writeFileSync(
      markerPath,
      JSON.stringify({ managedBy: 'cc-mirror', updatedAt: new Date().toISOString() }, null, 2)
    );
    return { status: exists ? 'updated' : 'installed', path: targetDir };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { status: 'failed', message };
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
};
