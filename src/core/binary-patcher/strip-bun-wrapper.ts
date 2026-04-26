/**
 * Strip Bun's CommonJS wrapper from an extracted entry module.
 *
 * Bun-compiled standalone binaries embed their entry module as:
 *
 *   // @bun @bytecode @bun-cjs
 *   (function(exports, require, module, __filename, __dirname) {<body>});
 *
 * Bun's runtime invokes that function with the right CJS arguments. Node's
 * own CommonJS loader doesn't auto-call function expressions, so on extraction
 * the body never runs. Stripping the wrapper turns the file back into a
 * regular Node-CJS module: Node wraps it itself with the same five arguments.
 *
 * We strip in two parts:
 *  - Leading: `// @bun ...\n(function(<args>) {`
 *  - Trailing: `})` (with optional whitespace/semicolon)
 */

export class BunWrapperNotFound extends Error {
  constructor(public readonly anchor: 'open' | 'close') {
    super(`strip-bun-wrapper: ${anchor} anchor not found`);
    this.name = 'BunWrapperNotFound';
  }
}

const WRAPPER_OPEN = /^\/\/ @bun[^\n]*\n\(function\([^)]*\) \{/;

/**
 * Returns the module body with Bun's CJS wrapper removed. Idempotent: a file
 * without the wrapper round-trips unchanged.
 */
export const stripBunWrapper = (source: string): string => {
  const open = source.match(WRAPPER_OPEN);
  if (!open || open.index === undefined) {
    if (!source.startsWith('// @bun')) return source;
    throw new BunWrapperNotFound('open');
  }

  let end = source.length;
  while (end > 0 && /\s|;/.test(source[end - 1])) end -= 1;
  if (end < 2 || source.slice(end - 2, end) !== '})') {
    throw new BunWrapperNotFound('close');
  }

  return source.slice(open[0].length, end - 2);
};
