/**
 * ShellEnvUpdateStep - Configures shell environment for Z.ai
 */

import { ensureZaiShellEnv } from '../../shell-env.js';
import { getProviderCapability } from '../../../providers/index.js';
import type { UpdateContext, UpdateStep } from '../types.js';

export class ShellEnvUpdateStep implements UpdateStep {
  name = 'ShellEnv';

  execute(ctx: UpdateContext): void {
    if (ctx.opts.settingsOnly) return;
    this.configure(ctx, false);
  }

  async executeAsync(ctx: UpdateContext): Promise<void> {
    if (ctx.opts.settingsOnly) return;
    await this.configure(ctx, true);
  }

  private async configure(ctx: UpdateContext, isAsync: boolean): Promise<void> {
    const { opts, meta, prefs, state } = ctx;

    const profile = getProviderCapability(meta.provider);
    const managesZaiKey = profile?.features.shellEnv.exports.includes('Z_AI_API_KEY') ?? false;

    if (prefs.shellEnvEnabled && managesZaiKey) {
      if (isAsync) {
        await ctx.report('Configuring shell environment...');
      } else {
        ctx.report('Configuring shell environment...');
      }

      const shellResult = ensureZaiShellEnv({ configDir: meta.configDir });

      if (shellResult.status === 'updated') {
        const suffix = shellResult.message ? ` (${shellResult.message})` : '';
        state.notes.push(`Z_AI_API_KEY written to ${shellResult.path}${suffix}`);
      } else if (shellResult.status === 'failed') {
        state.notes.push(`Z_AI_API_KEY not written: ${shellResult.message || 'unknown error'}`);
      } else if (shellResult.message) {
        state.notes.push(`Z_AI_API_KEY: ${shellResult.message}`);
      }
    } else if (managesZaiKey && opts.shellEnv === false) {
      state.notes.push('Z_AI_API_KEY not written to shell profile. Set it manually in your shell rc file.');
    }
  }
}
