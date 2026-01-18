/**
 * TeamModeUpdateStep - Patches cli.js to enable team mode features on update
 *
 * Team mode enables:
 * - TaskCreate, TaskGet, TaskUpdate, TaskList tools
 * - Team collaboration via shared task storage
 * - TodoWrite shows deprecation message pointing to new tools
 */

import fs from 'node:fs';
import path from 'node:path';
import { getProvider } from '../../../providers/index.js';
import { TEAM_MODE_SUPPORTED } from '../../constants.js';
import {
  installOrchestratorSkill,
  removeOrchestratorSkill,
  installTaskManagerSkill,
  removeTaskManagerSkill,
} from '../../skills.js';
import {
  copyTeamPackPrompts,
  configureTeamToolset,
  removeTeamPackPrompts,
  removeTeamToolset,
} from '../../../team-pack/index.js';
import { detectTeamModeState, setTeamModeEnabled } from '../team-mode-patch.js';
import type { UpdateContext, UpdateStep } from '../types.js';

export class TeamModeUpdateStep implements UpdateStep {
  name = 'TeamMode';

  private shouldEnableTeamMode(ctx: UpdateContext): boolean {
    // Enable if:
    // 1. Explicitly requested via opts, OR
    // 2. Provider defaults to team mode, OR
    // 3. Team mode is already enabled on this variant (to update skill)
    const provider = getProvider(ctx.meta.provider);
    return Boolean(ctx.opts.enableTeamMode) || Boolean(provider?.enablesTeamMode) || Boolean(ctx.meta.teamModeEnabled);
  }

  private shouldDisableTeamMode(ctx: UpdateContext): boolean {
    return Boolean(ctx.opts.disableTeamMode);
  }

  execute(ctx: UpdateContext): void {
    if (!TEAM_MODE_SUPPORTED) {
      this.handleUnsupported(ctx);
      return;
    }
    if (this.shouldDisableTeamMode(ctx)) {
      ctx.report('Disabling team mode...');
      this.unpatchCli(ctx);
      return;
    }
    if (!this.shouldEnableTeamMode(ctx)) return;
    ctx.report('Enabling team mode...');
    this.patchCli(ctx);
  }

  async executeAsync(ctx: UpdateContext): Promise<void> {
    if (!TEAM_MODE_SUPPORTED) {
      this.handleUnsupported(ctx);
      return;
    }
    if (this.shouldDisableTeamMode(ctx)) {
      await ctx.report('Disabling team mode...');
      this.unpatchCli(ctx);
      return;
    }
    if (!this.shouldEnableTeamMode(ctx)) return;
    await ctx.report('Enabling team mode...');
    this.patchCli(ctx);
  }

  private unpatchCli(ctx: UpdateContext): void {
    const { state, meta, paths } = ctx;

    // Find cli.js path
    const cliPath = path.join(paths.npmDir, 'node_modules', '@anthropic-ai', 'claude-code', 'cli.js');

    if (!fs.existsSync(cliPath)) {
      state.notes.push('Warning: cli.js not found, skipping team mode unpatch');
      // Still try to remove skill since user explicitly requested disable
      this.removeSkill(ctx);
      return;
    }

    // Read cli.js
    const content = fs.readFileSync(cliPath, 'utf8');

    const patchResult = setTeamModeEnabled(content, false);
    if (patchResult.state === 'unknown') {
      state.notes.push('Warning: Team mode marker not found in cli.js');
      // Still try to remove skill since user explicitly requested disable
      this.removeSkill(ctx);
      return;
    }
    if (!patchResult.changed && patchResult.state === 'disabled') {
      state.notes.push('Team mode already disabled');
      meta.teamModeEnabled = false;
      // Still remove skill since user explicitly requested disable
      this.removeSkill(ctx);
      return;
    }

    fs.writeFileSync(cliPath, patchResult.content);

    // Verify unpatch
    const verifyContent = fs.readFileSync(cliPath, 'utf8');
    if (detectTeamModeState(verifyContent) !== 'disabled') {
      state.notes.push('Warning: Team mode unpatch verification failed');
      // Still try to remove skill since user explicitly requested disable
      this.removeSkill(ctx);
      return;
    }

    meta.teamModeEnabled = false;
    state.notes.push('Team mode disabled successfully');

    // Remove the multi-agent orchestrator skill
    this.removeSkill(ctx);
  }

  private removeSkill(ctx: UpdateContext): void {
    const { state, meta } = ctx;
    const skillResult = removeOrchestratorSkill(meta.configDir);
    if (skillResult.status === 'removed') {
      state.notes.push('Multi-agent orchestrator skill removed');
    } else if (skillResult.status === 'failed') {
      state.notes.push(`Warning: orchestrator skill removal failed: ${skillResult.message}`);
    }

    const taskSkillResult = removeTaskManagerSkill(meta.configDir);
    if (taskSkillResult.status === 'removed') {
      state.notes.push('Task manager skill removed');
    } else if (taskSkillResult.status === 'failed') {
      state.notes.push(`Warning: task-manager skill removal failed: ${taskSkillResult.message}`);
    }
  }

  private patchCli(ctx: UpdateContext): void {
    const { state, meta, paths } = ctx;

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
    const content = fs.readFileSync(cliPath, 'utf8');

    const patchResult = setTeamModeEnabled(content, true);
    if (patchResult.state === 'unknown') {
      state.notes.push('Warning: Team mode marker not found in cli.js, patch may not work');
      return;
    }
    if (!patchResult.changed && patchResult.state === 'enabled') {
      state.notes.push('Team mode already enabled');
      meta.teamModeEnabled = true;
      return;
    }

    fs.writeFileSync(cliPath, patchResult.content);

    // Verify patch
    const verifyContent = fs.readFileSync(cliPath, 'utf8');
    if (detectTeamModeState(verifyContent) !== 'enabled') {
      state.notes.push('Warning: Team mode patch verification failed');
      return;
    }

    // Add team env vars and permissions to settings.json
    const settingsPath = path.join(meta.configDir, 'settings.json');
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

    meta.teamModeEnabled = true;
    state.notes.push('Team mode enabled successfully');

    // Install the multi-agent orchestrator skill
    const skillResult = installOrchestratorSkill(meta.configDir);
    if (skillResult.status === 'installed') {
      state.notes.push('Multi-agent orchestrator skill installed');
    } else if (skillResult.status === 'failed') {
      state.notes.push(`Warning: orchestrator skill install failed: ${skillResult.message}`);
    }

    // Install the task-manager skill
    const taskSkillResult = installTaskManagerSkill(meta.configDir);
    if (taskSkillResult.status === 'installed') {
      state.notes.push('Task manager skill installed');
    } else if (taskSkillResult.status === 'failed') {
      state.notes.push(`Warning: task-manager skill install failed: ${taskSkillResult.message}`);
    }

    // Copy team pack prompt files
    const systemPromptsDir = path.join(meta.tweakDir, 'system-prompts');
    const copiedFiles = copyTeamPackPrompts(systemPromptsDir);
    if (copiedFiles.length > 0) {
      state.notes.push(`Team pack prompts installed (${copiedFiles.join(', ')})`);
    }

    // Configure TweakCC toolset to block TodoWrite
    const tweakccConfigPath = path.join(meta.tweakDir, 'config.json');
    if (configureTeamToolset(tweakccConfigPath)) {
      state.notes.push('Team toolset configured (TodoWrite blocked)');
    }
  }

  private handleUnsupported(ctx: UpdateContext): void {
    const { meta, opts, state, paths } = ctx;
    if (!meta.teamModeEnabled && !opts.enableTeamMode && !opts.disableTeamMode) {
      return;
    }

    state.notes.push('Team mode is not supported in this cc-mirror release; disabling and removing team assets.');
    meta.teamModeEnabled = false;

    this.removeSkill(ctx);
    this.removeTeamSettings(ctx);

    const systemPromptsDir = path.join(meta.tweakDir, 'system-prompts');
    const removedPrompts = removeTeamPackPrompts(systemPromptsDir);
    if (removedPrompts.length > 0) {
      state.notes.push(`Team pack prompts removed (${removedPrompts.join(', ')})`);
    }

    const tweakccConfigPath = path.join(paths.variantDir, 'tweakcc', 'config.json');
    if (removeTeamToolset(tweakccConfigPath)) {
      state.notes.push('Team toolset removed');
    }
  }

  private removeTeamSettings(ctx: UpdateContext): void {
    const { meta, state } = ctx;
    const settingsPath = path.join(meta.configDir, 'settings.json');
    if (!fs.existsSync(settingsPath)) {
      return;
    }

    try {
      const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
      let changed = false;

      if (settings.env && typeof settings.env === 'object') {
        if ('CLAUDE_CODE_TEAM_MODE' in settings.env) {
          delete settings.env.CLAUDE_CODE_TEAM_MODE;
          changed = true;
        }
        if ('CLAUDE_CODE_AGENT_TYPE' in settings.env) {
          delete settings.env.CLAUDE_CODE_AGENT_TYPE;
          changed = true;
        }
      }

      if (settings.permissions?.allow && Array.isArray(settings.permissions.allow)) {
        const nextAllow = settings.permissions.allow.filter(
          (entry: string) => entry !== 'Skill(orchestration)' && entry !== 'Skill(task-manager)'
        );
        if (nextAllow.length !== settings.permissions.allow.length) {
          settings.permissions.allow = nextAllow;
          changed = true;
        }
      }

      if (changed) {
        fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
      }
    } catch {
      state.notes.push('Warning: Could not update settings.json to remove team mode flags');
    }
  }
}
