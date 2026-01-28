/**
 * SwarmModeStep - Patches cli.js to enable native multi-agent features
 *
 * Swarm mode enables (Claude Code 2.1.16+):
 * - TeammateTool for team coordination
 * - Delegate mode for Task tool
 * - Swarm spawning via ExitPlanMode
 * - Teammate mailbox/messaging
 * - Task ownership and claiming
 *
 * This replaces the legacy team mode patch with native Claude Code features.
 */

import fs from 'node:fs';
import path from 'node:path';
import { detectSwarmModeState, setSwarmModeEnabled } from '../swarm-mode-patch.js';
import type { BuildContext, BuildStep } from '../types.js';

export class SwarmModeStep implements BuildStep {
  name = 'SwarmMode';

  private shouldEnableSwarmMode(ctx: BuildContext): boolean {
    // Swarm mode is enabled by default unless explicitly disabled
    // Check for explicit disable flag (disableSwarmMode = true means don't enable)
    if (ctx.params.disableSwarmMode === true) return false;
    // Otherwise enable by default
    return true;
  }

  execute(ctx: BuildContext): void {
    if (!this.shouldEnableSwarmMode(ctx)) return;
    ctx.report('Enabling swarm mode...');
    this.patchCli(ctx);
  }

  async executeAsync(ctx: BuildContext): Promise<void> {
    if (!this.shouldEnableSwarmMode(ctx)) return;
    await ctx.report('Enabling swarm mode...');
    this.patchCli(ctx);
  }

  private patchCli(ctx: BuildContext): void {
    const { state, paths } = ctx;

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
      return;
    }

    fs.writeFileSync(cliPath, patchResult.content);

    // Verify patch
    const verifyContent = fs.readFileSync(cliPath, 'utf8');
    if (detectSwarmModeState(verifyContent) !== 'enabled') {
      state.notes.push('Warning: Swarm mode patch verification failed');
      return;
    }

    state.notes.push('Swarm mode enabled successfully');
    state.swarmModeEnabled = true;
  }
}
