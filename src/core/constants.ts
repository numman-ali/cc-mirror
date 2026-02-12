import os from 'node:os';
import path from 'node:path';

export const DEFAULT_ROOT = path.join(os.homedir(), '.cc-mirror');
export const DEFAULT_BIN_DIR =
  process.platform === 'win32' ? path.join(DEFAULT_ROOT, 'bin') : path.join(os.homedir(), '.local', 'bin');
export const TWEAKCC_VERSION = '4.0.1';
// Claude Code version/channel used for installs unless overridden.
// "stable" tracks the upstream stable channel; "latest" tracks newest releases.
export const DEFAULT_CLAUDE_VERSION = 'latest';
export const DEFAULT_CLAUDE_NATIVE_CACHE_DIR = path.join(DEFAULT_ROOT, '.cache', 'claude-native');
