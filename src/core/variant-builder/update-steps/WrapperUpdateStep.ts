/**
 * WrapperUpdateStep - Writes or updates the CLI wrapper script
 */

import path from 'node:path';
import { ensureDir } from '../../fs.js';
import { expandTilde } from '../../paths.js';
import { writeWrapper, writeWindowsWrapper } from '../../wrapper.js';
import type { UpdateContext, UpdateStep } from '../types.js';

export class WrapperUpdateStep implements UpdateStep {
  name = 'Wrapper';

  execute(ctx: UpdateContext): void {
    if (ctx.opts.settingsOnly) return;
    ctx.report('Writing CLI wrapper...');
    this.doWriteWrapper(ctx);
  }

  async executeAsync(ctx: UpdateContext): Promise<void> {
    if (ctx.opts.settingsOnly) return;
    await ctx.report('Writing CLI wrapper...');
    this.doWriteWrapper(ctx);
  }

  private doWriteWrapper(ctx: UpdateContext): void {
    const { name, opts, meta } = ctx;

    const resolvedBin = opts.binDir ? (expandTilde(opts.binDir) ?? opts.binDir) : meta.binDir;

    if (resolvedBin) {
      ensureDir(resolvedBin);
      const wrapperPath = path.join(resolvedBin, name);
      if (process.platform === 'win32') {
        writeWindowsWrapper(wrapperPath, meta.configDir, meta.binaryPath, name);
      } else {
        writeWrapper(wrapperPath, meta.configDir, meta.binaryPath, 'node');
      }
      meta.binDir = resolvedBin;
    }
  }
}
