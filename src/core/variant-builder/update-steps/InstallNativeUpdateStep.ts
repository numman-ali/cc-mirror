/**
 * InstallNativeUpdateStep - Installs Claude Code via native binary download
 */

import { DEFAULT_CLAUDE_NATIVE_CACHE_DIR } from '../../constants.js';
import { ensureDir } from '../../fs.js';
import { installNativeClaudeAsync } from '../../install.js';
import type { UpdateContext, UpdateStep } from '../types.js';

export class InstallNativeUpdateStep implements UpdateStep {
  name = 'InstallNative';

  execute(ctx: UpdateContext): void {
    if (ctx.opts.settingsOnly) return;
    throw new Error('Native installs require async mode (use updateVariantAsync).');
  }

  async executeAsync(ctx: UpdateContext): Promise<void> {
    if (ctx.opts.settingsOnly) return;

    const { meta, paths, prefs } = ctx;
    await ctx.report(`Installing Claude Code (native) ${prefs.resolvedClaudeVersion}...`);

    ensureDir(paths.nativeDir);

    const install = await installNativeClaudeAsync({
      nativeDir: paths.nativeDir,
      version: prefs.resolvedClaudeVersion,
      cacheDir: DEFAULT_CLAUDE_NATIVE_CACHE_DIR,
      stdio: prefs.commandStdio,
    });

    meta.binaryPath = install.binaryPath;
    meta.nativeDir = paths.nativeDir;
    meta.nativeVersion = prefs.resolvedClaudeVersion;
    meta.nativePlatform = install.platform;
    meta.claudeOrig = `native:${install.resolvedVersion}`;
  }
}
