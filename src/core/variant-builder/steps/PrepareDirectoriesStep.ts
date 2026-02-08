/**
 * PrepareDirectoriesStep - Creates the directory structure for a variant
 */

import { ensureDir } from '../../fs.js';
import type { BuildContext, BuildStep } from '../types.js';

export class PrepareDirectoriesStep implements BuildStep {
  name = 'PrepareDirectories';

  execute(ctx: BuildContext): void {
    ctx.report('Preparing directories...');
    ensureDir(ctx.paths.variantDir);
    ensureDir(ctx.paths.configDir);
    ensureDir(ctx.paths.tweakDir);
    ensureDir(ctx.paths.resolvedBin);
    ensureDir(ctx.paths.nativeDir);
  }

  async executeAsync(ctx: BuildContext): Promise<void> {
    await ctx.report('Preparing directories...');
    ensureDir(ctx.paths.variantDir);
    ensureDir(ctx.paths.configDir);
    ensureDir(ctx.paths.tweakDir);
    ensureDir(ctx.paths.resolvedBin);
    ensureDir(ctx.paths.nativeDir);
  }
}
