/**
 * WrapperStep - Writes the CLI wrapper script
 */

import { writeWrapper } from '../../wrapper.js';
import { ensureWindowsUserPath } from '../../windows-path.js';
import type { BuildContext, BuildStep } from '../types.js';

const resolveTarget = (ctx: BuildContext): { binary: string; runtime: 'native' | 'node' } => {
  if (ctx.state.wrapperRuntime === 'node' && ctx.state.nodeEntryPath) {
    return { binary: ctx.state.nodeEntryPath, runtime: 'node' };
  }
  return { binary: ctx.state.binaryPath, runtime: 'native' };
};

export class WrapperStep implements BuildStep {
  name = 'Wrapper';

  execute(ctx: BuildContext): void {
    ctx.report('Writing CLI wrapper...');
    const { binary, runtime } = resolveTarget(ctx);
    writeWrapper(ctx.paths.wrapperPath, ctx.paths.configDir, binary, runtime);
    this.ensureWindowsPath(ctx);
  }

  async executeAsync(ctx: BuildContext): Promise<void> {
    await ctx.report('Writing CLI wrapper...');
    const { binary, runtime } = resolveTarget(ctx);
    writeWrapper(ctx.paths.wrapperPath, ctx.paths.configDir, binary, runtime);
    this.ensureWindowsPath(ctx);
  }

  private ensureWindowsPath(ctx: BuildContext): void {
    const result = ensureWindowsUserPath(ctx.paths.resolvedBin);
    if (result.status === 'updated') {
      ctx.state.notes.push(result.message);
      return;
    }
    if (result.status === 'failed') {
      ctx.state.notes.push(`Windows PATH update failed: ${result.message}`);
    }
  }
}
