/**
 * WrapperUpdateStep - Writes or updates the CLI wrapper script
 */

import { ensureDir } from '../../fs.js';
import { expandTilde, getWrapperPath } from '../../paths.js';
import { writeWrapper } from '../../wrapper.js';
import { ensureWindowsUserPath } from '../../windows-path.js';
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
    const { name, opts, meta, state } = ctx;

    const resolvedBin = opts.binDir ? (expandTilde(opts.binDir) ?? opts.binDir) : meta.binDir;

    if (resolvedBin) {
      ensureDir(resolvedBin);
      const wrapperPath = getWrapperPath(resolvedBin, name);
      // Prefer the freshly-resolved runtime from this update; fall back to the
      // persisted choice in variant.json (so settings-only updates keep the
      // previously chosen runtime).
      const runtime = state.wrapperRuntime ?? meta.wrapperRuntime ?? 'native';
      const target =
        runtime === 'node' ? (state.nodeEntryPath ?? meta.nodeEntryPath ?? meta.binaryPath) : meta.binaryPath;
      writeWrapper(wrapperPath, meta.configDir, target, runtime);
      meta.binDir = resolvedBin;
      const pathResult = ensureWindowsUserPath(resolvedBin);
      if (pathResult.status === 'updated') {
        ctx.state.notes.push(pathResult.message);
      } else if (pathResult.status === 'failed') {
        ctx.state.notes.push(`Windows PATH update failed: ${pathResult.message}`);
      }
    }
  }
}
