import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import { once } from 'node:events';
import { Readable } from 'node:stream';
import type { ReadableStream as NodeReadableStream } from 'node:stream/web';
import { finished } from 'node:stream/promises';
import { commandExists } from './paths.js';

const CLAUDE_VERSION_PATTERN = /^(stable|latest|[0-9]+\.[0-9]+\.[0-9]+(?:-[^[:space:]]+)?)$/;

const CLAUDE_NATIVE_RELEASES_URL =
  process.env.CC_MIRROR_CLAUDE_RELEASES_URL ??
  'https://storage.googleapis.com/claude-code-dist-86c565f3-f756-42ad-8dfa-d59b1c096819/claude-code-releases';

const assertValidClaudeVersion = (value: string) => {
  const trimmed = (value ?? '').trim();
  if (!trimmed || !CLAUDE_VERSION_PATTERN.test(trimmed)) {
    throw new Error(`Invalid Claude Code version "${value}". Use "stable", "latest", or a version like "2.1.37".`);
  }
};

const resolveNativePlatformKey = (): string => {
  const os = process.platform;
  const arch = process.arch;

  const normArch = arch === 'x64' ? 'x64' : arch === 'arm64' ? 'arm64' : null;
  if (!normArch) {
    throw new Error(`Unsupported architecture: ${arch}`);
  }

  if (os === 'darwin') {
    return `darwin-${normArch}`;
  }
  if (os === 'win32') {
    if (normArch !== 'x64') {
      throw new Error(`Unsupported Windows architecture: ${arch}`);
    }
    return 'win32-x64';
  }
  if (os !== 'linux') {
    throw new Error(`Unsupported platform: ${os}`);
  }

  // Detect musl on Linux (best-effort, no hard dependency on ldd).
  const muslLibs =
    (normArch === 'x64' && fs.existsSync('/lib/libc.musl-x86_64.so.1')) ||
    (normArch === 'arm64' && fs.existsSync('/lib/libc.musl-aarch64.so.1'));
  let isMusl = Boolean(muslLibs);
  if (!isMusl && commandExists('ldd')) {
    try {
      const out = spawnSync('ldd', ['/bin/ls'], { encoding: 'utf8' });
      isMusl = out.status === 0 && /musl/i.test(out.stdout + out.stderr);
    } catch {
      // ignore
    }
  }

  return isMusl ? `linux-${normArch}-musl` : `linux-${normArch}`;
};

export const resolveNativeClaudePath = (nativeDir: string): string => {
  const filename = process.platform === 'win32' ? 'claude.exe' : 'claude';
  return path.join(nativeDir, filename);
};

const fetchText = async (url: string): Promise<string> => {
  if (typeof fetch !== 'function') {
    throw new Error('Native installs require Node.js 18+ (global fetch).');
  }
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url} (${res.status})`);
  }
  return await res.text();
};

const fetchJson = async <T>(url: string): Promise<T> => {
  const text = await fetchText(url);
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`Failed to parse JSON from ${url}`);
  }
};

const downloadToFileWithSha256 = async (url: string, outPath: string): Promise<string> => {
  if (typeof fetch !== 'function') {
    throw new Error('Native installs require Node.js 18+ (global fetch).');
  }
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Download failed for ${url} (${res.status})`);
  }
  if (!res.body) {
    throw new Error(`Download failed for ${url} (empty response body)`);
  }

  const tmpPath = `${outPath}.tmp-${Date.now()}`;
  const file = fs.createWriteStream(tmpPath);
  const hash = crypto.createHash('sha256');

  try {
    // TS: DOM ReadableStream (fetch) vs Node stream/web ReadableStream type mismatch.
    // Runtime is fine on Node 18+; we just coerce for compilation.
    const nodeStream = Readable.fromWeb(res.body as unknown as NodeReadableStream);
    for await (const chunk of nodeStream) {
      const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as Uint8Array);
      hash.update(buf);
      if (!file.write(buf)) {
        await once(file, 'drain');
      }
    }
    file.end();
    await finished(file);

    // Ensure atomic-ish replace (Windows can't overwrite existing targets).
    try {
      fs.rmSync(outPath, { force: true });
    } catch {
      // ignore
    }
    fs.renameSync(tmpPath, outPath);
    return hash.digest('hex');
  } catch (error) {
    try {
      file.destroy();
    } catch {
      // ignore
    }
    try {
      fs.rmSync(tmpPath, { force: true });
    } catch {
      // ignore
    }
    throw error;
  }
};

const sha256File = async (filePath: string): Promise<string> => {
  const hash = crypto.createHash('sha256');
  const stream = fs.createReadStream(filePath);
  stream.on('data', (chunk) => hash.update(chunk));
  await finished(stream);
  return hash.digest('hex');
};

type ClaudeNativeManifest = {
  version: string;
  buildDate?: string;
  platforms: Record<string, { binary?: string; checksum: string }>;
};

const resolveClaudeNativeVersion = async (versionSpec: string): Promise<string> => {
  const trimmed = (versionSpec ?? '').trim();
  assertValidClaudeVersion(trimmed);
  if (trimmed === 'stable' || trimmed === 'latest') {
    return (await fetchText(`${CLAUDE_NATIVE_RELEASES_URL}/${trimmed}`)).trim();
  }
  return trimmed;
};

export const installNativeClaudeAsync = async (params: {
  nativeDir: string;
  version: string;
  cacheDir?: string;
  stdio?: 'inherit' | 'pipe';
}): Promise<{ binaryPath: string; resolvedVersion: string; platform: string }> => {
  const versionSpec = (params.version ?? '').trim();
  assertValidClaudeVersion(versionSpec);

  const platform = resolveNativePlatformKey();
  const resolvedVersion = await resolveClaudeNativeVersion(versionSpec);
  const manifestUrl = `${CLAUDE_NATIVE_RELEASES_URL}/${resolvedVersion}/manifest.json`;
  const manifest = await fetchJson<ClaudeNativeManifest>(manifestUrl);
  const platformInfo = manifest.platforms?.[platform];
  if (!platformInfo?.checksum) {
    throw new Error(`Platform ${platform} not found in Claude Code manifest for ${resolvedVersion}`);
  }

  // Older manifests omit the binary filename; the installer scripts assume these defaults.
  const defaultBinary = platform.startsWith('win32-') ? 'claude.exe' : 'claude';
  const binaryName = platformInfo.binary?.trim() || defaultBinary;

  const expected = platformInfo.checksum;
  if (!/^[a-f0-9]{64}$/i.test(expected)) {
    throw new Error(`Invalid checksum for ${platform} in manifest for ${resolvedVersion}`);
  }

  const binaryUrl = `${CLAUDE_NATIVE_RELEASES_URL}/${resolvedVersion}/${platform}/${binaryName}`;
  const binaryPath = resolveNativeClaudePath(params.nativeDir);
  const cacheRoot = params.cacheDir?.trim();
  const cachePath = cacheRoot ? resolveNativeClaudePath(path.join(cacheRoot, resolvedVersion, platform)) : null;

  if (cachePath && fs.existsSync(cachePath)) {
    const cached = await sha256File(cachePath);
    if (cached.toLowerCase() === expected.toLowerCase()) {
      try {
        fs.rmSync(binaryPath, { force: true });
      } catch {
        // ignore
      }
      fs.copyFileSync(cachePath, binaryPath);
      if (process.platform !== 'win32') {
        try {
          fs.chmodSync(binaryPath, 0o755);
        } catch {
          // ignore
        }
      }
      return { binaryPath, resolvedVersion, platform };
    }
    try {
      fs.rmSync(cachePath, { force: true });
    } catch {
      // ignore
    }
  }

  if (cachePath) {
    fs.mkdirSync(path.dirname(cachePath), { recursive: true });
  }

  const downloadTarget = cachePath ?? binaryPath;
  const actual = await downloadToFileWithSha256(binaryUrl, downloadTarget);
  if (actual.toLowerCase() !== expected.toLowerCase()) {
    try {
      fs.rmSync(downloadTarget, { force: true });
    } catch {
      // ignore
    }
    throw new Error(`Checksum verification failed for ${binaryUrl}`);
  }

  if (cachePath) {
    try {
      fs.rmSync(binaryPath, { force: true });
    } catch {
      // ignore
    }
    fs.copyFileSync(cachePath, binaryPath);
  }

  if (process.platform !== 'win32') {
    try {
      fs.chmodSync(binaryPath, 0o755);
    } catch {
      // ignore
    }
  }

  return { binaryPath, resolvedVersion, platform };
};
