/**
 * WrapperUpdateStep - Writes or updates the CLI wrapper script
 */

import { ensureDir } from '../../fs.js';
import { expandTilde, getWrapperPath } from '../../paths.js';
import { writeWrapper } from '../../wrapper.js';
import type { UpdateContext, UpdateStep } from '../types.js';

export class WrapperUpdateStep implements UpdateStep {
  name = 'Wrapper';

  execute(ctx: UpdateContext): void {
    if (ctx.opts.settingsOnly) return;
    ctx.report('Writing CLI wrapper...');
    this.writeWrapper(ctx);
  }

  async executeAsync(ctx: UpdateContext): Promise<void> {
    if (ctx.opts.settingsOnly) return;
    await ctx.report('Writing CLI wrapper...');
    this.writeWrapper(ctx);
  }

  private writeWrapper(ctx: UpdateContext): void {
    const { name, opts, meta } = ctx;

    const resolvedBin = opts.binDir ? (expandTilde(opts.binDir) ?? opts.binDir) : meta.binDir;

    if (resolvedBin) {
      ensureDir(resolvedBin);
      const wrapperPath = getWrapperPath(resolvedBin, name);
      writeWrapper(wrapperPath, meta.configDir, meta.binaryPath, 'node');
      meta.binDir = resolvedBin;
    }
  }
}
