/**
 * Ink Testing Library Helpers
 *
 * Common utilities for testing ink-based TUI components.
 */

/**
 * Wait for a short time to allow ink to process updates
 */
const tickDelay = process.platform === 'win32' ? 100 : 30;
export const tick = () => new Promise((resolve) => setTimeout(resolve, tickDelay));

/**
 * Send input to stdin and wait for processing
 */
export const send = async (stdin: { write: (value: string) => void }, input: string) => {
  stdin.write(input);
  await tick();
};

/**
 * Wait for a predicate to become true
 */
export const waitFor = async (predicate: () => boolean, attempts = 50): Promise<boolean> => {
  for (let i = 0; i < attempts; i += 1) {
    if (predicate()) return true;
    await tick();
  }
  return false;
};

/**
 * Common key codes for terminal input
 */
export const KEYS = {
  up: '\u001b[A',
  down: '\u001b[B',
  enter: '\r',
  escape: '\u001b',
  tab: '\t',
} as const;
