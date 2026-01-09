/**
 * Ink Testing Library Helpers
 *
 * Common utilities for testing ink-based TUI components.
 */

const TICK_MS = process.env.CI ? 80 : 30;
const DEFAULT_ATTEMPTS = process.env.CI ? 100 : 50;

/**
 * Wait for a short time to allow ink to process updates
 */
export const tick = () => new Promise((resolve) => setTimeout(resolve, TICK_MS));

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
export const waitFor = async (predicate: () => boolean, attempts = DEFAULT_ATTEMPTS): Promise<boolean> => {
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
