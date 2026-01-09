import os from 'node:os';
import path from 'node:path';

export const DEFAULT_ROOT = path.join(os.homedir(), '.cc-mirror');
export const DEFAULT_BIN_DIR =
  process.platform === 'win32' ? path.join(DEFAULT_ROOT, 'bin') : path.join(os.homedir(), '.local', 'bin');
export const TWEAKCC_VERSION = '3.2.2';
export const DEFAULT_NPM_PACKAGE = '@anthropic-ai/claude-code';
export const DEFAULT_NPM_VERSION = '2.1.1';
