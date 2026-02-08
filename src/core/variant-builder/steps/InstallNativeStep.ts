/**
 * InstallNativeStep - Installs Claude Code via native binary download
 */

import { DEFAULT_CLAUDE_NATIVE_CACHE_DIR } from '../../constants.js';
import { installNativeClaudeAsync } from '../../install.js';
import type { BuildContext, BuildStep } from '../types.js';

export class InstallNativeStep implements BuildStep {
  name = 'InstallNative';

  execute(_ctx: BuildContext): void {
    // Native installs require async fetch streaming to avoid blocking the TUI.
    throw new Error('Native installs require async mode (use createVariantAsync).');
  }

  async executeAsync(ctx: BuildContext): Promise<void> {
    const { prefs, paths, state } = ctx;
    await ctx.report(`Installing Claude Code (native) ${prefs.resolvedClaudeVersion}...`);

    const install = await installNativeClaudeAsync({
      nativeDir: paths.nativeDir,
      version: prefs.resolvedClaudeVersion,
      cacheDir: DEFAULT_CLAUDE_NATIVE_CACHE_DIR,
      stdio: prefs.commandStdio,
    });

    state.binaryPath = install.binaryPath;
    state.nativePlatform = install.platform;
    state.nativeResolvedVersion = install.resolvedVersion;
    // Record the *resolved* version for provenance, even if the user pinned "stable"/"latest".
    state.claudeBinary = `native:${install.resolvedVersion}`;
    state.notes.push(`Claude Code native: ${install.resolvedVersion} (${install.platform})`);
  }
}
