/**
 * TeamModeStep - Patches cli.js to enable team mode features
 *
 * Team mode enables:
 * - TaskCreate, TaskGet, TaskUpdate, TaskList tools
 * - Team collaboration via shared task storage
 * - TodoWrite shows deprecation message pointing to new tools
 */

import fs from 'node:fs';
import path from 'node:path';
import { installOrchestratorSkill, installTaskManagerSkill } from '../../skills.js';
import { copyTeamPackPrompts, configureTeamToolset } from '../../../team-pack/index.js';
import type { BuildContext, BuildStep } from '../types.js';

// The minified function that controls team mode
const TEAM_MODE_DISABLED = 'function sU(){return!1}';
const TEAM_MODE_ENABLED = 'function sU(){return!0}';

export class TeamModeStep implements BuildStep {
  name = 'TeamMode';

  private shouldEnableTeamMode(ctx: BuildContext): boolean {
    // Enable if explicitly requested via params OR if provider defaults to team mode
    return Boolean(ctx.params.enableTeamMode) || Boolean(ctx.provider.enablesTeamMode);
  }

  execute(ctx: BuildContext): void {
    if (!this.shouldEnableTeamMode(ctx)) return;
    ctx.report('Enabling team mode...');
    this.patchCli(ctx);
  }

  async executeAsync(ctx: BuildContext): Promise<void> {
    if (!this.shouldEnableTeamMode(ctx)) return;
    await ctx.report('Enabling team mode...');
    this.patchCli(ctx);
  }

  private patchCli(ctx: BuildContext): void {
    const { state, paths } = ctx;

    // Find cli.js path
    const cliPath = path.join(paths.npmDir, 'node_modules', '@anthropic-ai', 'claude-code', 'cli.js');
    const backupPath = `${cliPath}.backup`;

    if (!fs.existsSync(cliPath)) {
      state.notes.push('Warning: cli.js not found, skipping team mode patch');
      return;
    }

    // Create backup if not exists
    if (!fs.existsSync(backupPath)) {
      fs.copyFileSync(cliPath, backupPath);
    }

    // Read cli.js
    let content = fs.readFileSync(cliPath, 'utf8');

    // Check if already patched
    if (content.includes(TEAM_MODE_ENABLED)) {
      state.notes.push('Team mode already enabled');
      return;
    }

    // Check if patchable
    if (!content.includes(TEAM_MODE_DISABLED)) {
      state.notes.push('Warning: Team mode function not found in cli.js, patch may not work');
      return;
    }

    // Apply patch
    content = content.replace(TEAM_MODE_DISABLED, TEAM_MODE_ENABLED);
    fs.writeFileSync(cliPath, content);

    // Verify patch
    const verifyContent = fs.readFileSync(cliPath, 'utf8');
    if (!verifyContent.includes(TEAM_MODE_ENABLED)) {
      state.notes.push('Warning: Team mode patch verification failed');
      return;
    }

    // Add team env vars and permissions to settings.json
    const settingsPath = path.join(paths.configDir, 'settings.json');
    if (fs.existsSync(settingsPath)) {
      try {
        const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
        settings.env = settings.env || {};
        // Use TEAM_MODE flag (not TEAM_NAME) - wrapper sets actual team name dynamically
        if (!settings.env.CLAUDE_CODE_TEAM_MODE) {
          settings.env.CLAUDE_CODE_TEAM_MODE = '1';
        }
        if (!settings.env.CLAUDE_CODE_AGENT_TYPE) {
          settings.env.CLAUDE_CODE_AGENT_TYPE = 'team-lead';
        }

        // Add orchestration skill to auto-approve list
        settings.permissions = settings.permissions || {};
        settings.permissions.allow = settings.permissions.allow || [];
        if (!settings.permissions.allow.includes('Skill(orchestration)')) {
          settings.permissions.allow.push('Skill(orchestration)');
        }

        fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
      } catch {
        state.notes.push('Warning: Could not update settings.json with team env vars');
      }
    }

    state.notes.push('Team mode enabled successfully');

    // Install the multi-agent orchestrator skill
    const skillResult = installOrchestratorSkill(paths.configDir);
    if (skillResult.status === 'installed') {
      state.notes.push('Multi-agent orchestrator skill installed');
    } else if (skillResult.status === 'failed') {
      state.notes.push(`Warning: orchestrator skill install failed: ${skillResult.message}`);
    }

    // Install the task-manager skill
    const taskSkillResult = installTaskManagerSkill(paths.configDir);
    if (taskSkillResult.status === 'installed') {
      state.notes.push('Task manager skill installed');
    } else if (taskSkillResult.status === 'failed') {
      state.notes.push(`Warning: task-manager skill install failed: ${taskSkillResult.message}`);
    }

    // Copy team pack prompt files
    const systemPromptsDir = path.join(paths.tweakDir, 'system-prompts');
    const copiedFiles = copyTeamPackPrompts(systemPromptsDir);
    if (copiedFiles.length > 0) {
      state.notes.push(`Team pack prompts installed (${copiedFiles.join(', ')})`);
    }

    // Configure TweakCC toolset to block TodoWrite
    const tweakccConfigPath = path.join(paths.tweakDir, 'config.json');
    if (configureTeamToolset(tweakccConfigPath)) {
      state.notes.push('Team toolset configured (TodoWrite blocked)');
    }
  }
}
