/**
 * SwarmModeUpdateStep - Re-applies swarm mode patch on updates
 *
 * Since npm reinstall may overwrite the patched cli.js, we need to
 * re-apply the swarm mode patch during updates.
 *
 * Swarm mode enables (Claude Code 2.1.16+):
 * - TeammateTool for team coordination
 * - Delegate mode for Task tool
 * - Swarm spawning via ExitPlanMode
 * - Teammate mailbox/messaging
 * - Task ownership and claiming
 */

import fs from 'node:fs';
import path from 'node:path';
import { NATIVE_MULTIAGENT_SUPPORTED } from '../../constants.js';
import { detectSwarmModeState, setSwarmModeEnabled } from '../swarm-mode-patch.js';
import type { UpdateContext, UpdateStep } from '../types.js';

export class SwarmModeUpdateStep implements UpdateStep {
  name = 'SwarmMode';

  private shouldEnableSwarmMode(ctx: UpdateContext): boolean {
    // Swarm mode is enabled by default on updates unless:
    // 1. The variant was created with swarm mode disabled, OR
    // 2. The variant.json doesn't have swarmModeEnabled set (old variant)
    //
    // For old variants without swarmModeEnabled, we enable it during update
    // to bring them up to date with the new default behavior.
    if (ctx.meta.swarmModeEnabled === false) return false;
    return true;
  }

  execute(ctx: UpdateContext): void {
    if (!NATIVE_MULTIAGENT_SUPPORTED) return;
    if (!this.shouldEnableSwarmMode(ctx)) return;
    ctx.report('Re-applying swarm mode patch...');
    this.patchCli(ctx);
  }

  async executeAsync(ctx: UpdateContext): Promise<void> {
    if (!NATIVE_MULTIAGENT_SUPPORTED) return;
    if (!this.shouldEnableSwarmMode(ctx)) return;
    await ctx.report('Re-applying swarm mode patch...');
    this.patchCli(ctx);
  }

  private patchCli(ctx: UpdateContext): void {
    const { state, meta, paths } = ctx;

    // Find cli.js path
    const cliPath = path.join(paths.npmDir, 'node_modules', '@anthropic-ai', 'claude-code', 'cli.js');
    const backupPath = `${cliPath}.backup`;

    if (!fs.existsSync(cliPath)) {
      state.notes.push('Warning: cli.js not found, skipping swarm mode patch');
      return;
    }

    // Create backup if not exists
    if (!fs.existsSync(backupPath)) {
      fs.copyFileSync(cliPath, backupPath);
    }

    // Read cli.js
    const content = fs.readFileSync(cliPath, 'utf8');

    const patchResult = setSwarmModeEnabled(content, true);
    if (patchResult.state === 'unknown') {
      state.notes.push('Warning: Swarm mode gate not found in cli.js, patch may not work');
      return;
    }
    if (!patchResult.changed && patchResult.state === 'enabled') {
      state.notes.push('Swarm mode already enabled');
      meta.swarmModeEnabled = true;
      return;
    }

    fs.writeFileSync(cliPath, patchResult.content);

    // Verify patch
    const verifyContent = fs.readFileSync(cliPath, 'utf8');
    if (detectSwarmModeState(verifyContent) !== 'enabled') {
      state.notes.push('Warning: Swarm mode patch verification failed');
      return;
    }

    meta.swarmModeEnabled = true;
    state.notes.push('Swarm mode enabled successfully');
  }
}
