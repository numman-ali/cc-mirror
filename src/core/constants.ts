import os from 'node:os';
import path from 'node:path';

export const DEFAULT_ROOT = path.join(os.homedir(), '.claude-sneakpeek');
export const DEFAULT_BIN_DIR =
  process.platform === 'win32' ? path.join(DEFAULT_ROOT, 'bin') : path.join(os.homedir(), '.local', 'bin');
export const TWEAKCC_VERSION = '3.2.2';
export const DEFAULT_NPM_PACKAGE = '@anthropic-ai/claude-code';
export const DEFAULT_NPM_VERSION = '2.1.22';

// Native multi-agent features (swarms, teammates) are available in Claude Code 2.1.16+
// These are gated by statsig flag 'tengu_brass_pebble' and can be overridden with
// CLAUDE_CODE_AGENT_SWARMS env var. See docs/research/native-multiagent-gates.md
export const NATIVE_MULTIAGENT_MIN_VERSION = '2.1.16';
export const NATIVE_MULTIAGENT_SUPPORTED = true;

// Legacy team mode (cli.js patching) is deprecated - native features replace it
// @deprecated Use native multi-agent features instead
export const TEAM_MODE_SUPPORTED = false;
