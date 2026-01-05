import os from 'node:os';
import path from 'node:path';

export const DEFAULT_ROOT = path.join(os.homedir(), '.cc-mirror');
export const DEFAULT_BIN_DIR =
  process.platform === 'win32'
    ? path.join(os.homedir(), '.cc-mirror', 'bin')
    : path.join(os.homedir(), '.local', 'bin');
export const TWEAKCC_VERSION = '3.2.2';
export const DEFAULT_NPM_PACKAGE = '@anthropic-ai/claude-code';
export const DEFAULT_NPM_VERSION = '2.0.76';

// ANSI color codes for splash screen ASCII art
export const SPLASH_COLORS = {
  reset: '\x1b[0m',
  // Zai: Gold/Amber gradient
  zaiPrimary: '\x1b[38;5;220m',
  zaiSecondary: '\x1b[38;5;214m',
  zaiAccent: '\x1b[38;5;208m',
  zaiDim: '\x1b[38;5;172m',
  // MiniMax: Coral/Red/Orange gradient
  mmPrimary: '\x1b[38;5;203m',
  mmSecondary: '\x1b[38;5;209m',
  mmAccent: '\x1b[38;5;208m',
  mmDim: '\x1b[38;5;167m',
  // OpenRouter: Cyan/Teal gradient
  orPrimary: '\x1b[38;5;43m',
  orSecondary: '\x1b[38;5;49m',
  orAccent: '\x1b[38;5;37m',
  orDim: '\x1b[38;5;30m',
  // CCRouter: Sky blue gradient
  ccrPrimary: '\x1b[38;5;39m',
  ccrSecondary: '\x1b[38;5;45m',
  ccrAccent: '\x1b[38;5;33m',
  ccrDim: '\x1b[38;5;31m',
  // Mirror: Silver/Chrome with electric blue
  mirPrimary: '\x1b[38;5;252m',
  mirSecondary: '\x1b[38;5;250m',
  mirAccent: '\x1b[38;5;45m',
  mirDim: '\x1b[38;5;243m',
  // Default: White/Gray
  defPrimary: '\x1b[38;5;255m',
  defDim: '\x1b[38;5;245m',
} as const;
