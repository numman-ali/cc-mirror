/**
 * ShellEnvStep - Configures shell environment variables (Z.ai specific)
 */

import { ensureZaiShellEnv } from '../../shell-env.js';
import { getProviderCapability } from '../../../providers/index.js';
import type { BuildContext, BuildStep } from '../types.js';

export class ShellEnvStep implements BuildStep {
  name = 'ShellEnv';

  execute(ctx: BuildContext): void {
    this.setupShellEnv(ctx);
  }

  async executeAsync(ctx: BuildContext): Promise<void> {
    const profile = getProviderCapability(ctx.params.providerKey);
    if (ctx.prefs.shellEnvEnabled && profile?.features.shellEnv.exports.includes('Z_AI_API_KEY')) {
      await ctx.report('Configuring shell environment...');
    }
    this.setupShellEnv(ctx);
  }

  private setupShellEnv(ctx: BuildContext): void {
    const { params, paths, prefs, state } = ctx;

    const profile = getProviderCapability(params.providerKey);
    const managesZaiKey = profile?.features.shellEnv.exports.includes('Z_AI_API_KEY') ?? false;

    if (prefs.shellEnvEnabled && managesZaiKey) {
      ctx.report('Configuring shell environment...');
      const shellResult = ensureZaiShellEnv({
        apiKey: state.resolvedApiKey ?? null,
        configDir: paths.configDir,
      });

      if (shellResult.status === 'updated') {
        const suffix = shellResult.message ? ` (${shellResult.message})` : '';
        state.notes.push(`Z_AI_API_KEY written to ${shellResult.path}${suffix}`);
      } else if (shellResult.status === 'failed') {
        state.notes.push(`Z_AI_API_KEY not written: ${shellResult.message || 'unknown error'}`);
      } else if (shellResult.message) {
        state.notes.push(`Z_AI_API_KEY: ${shellResult.message}`);
      }
    } else if (managesZaiKey) {
      state.notes.push('Z_AI_API_KEY not written to shell profile. Set it manually in your shell rc file.');
    }
  }
}
