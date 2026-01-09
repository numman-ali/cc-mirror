/**
 * Test Helpers
 *
 * Barrel export for all test helper modules.
 */

// Ink testing utilities
export { tick, send, waitFor, KEYS } from './ink-helpers.js';

// Filesystem utilities
export { makeTempDir, writeExecutable, readFile, cleanup, resolveNpmCliPath } from './fs-helpers.js';

// Mock core module for TUI tests
export { makeCore } from './mock-core.js';
export type { MockCoreCalls } from './mock-core.js';
