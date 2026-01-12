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
const TEAM_MODE_DISABLED = 'function Uq(){return!1}';
const TEAM_MODE_ENABLED = 'function Uq(){return!0}';

// Regex patterns for patching incompatible template expressions in Claude Code 2.1.1
const REGEX_TASK_MANAGEMENT =
  /\$\{AVAILABLE_TOOLS_SET\.has\(TODO_TOOL_OBJECT\.name\)\?`# Task Management[\s\S]*?`:""\}/g;
const REGEX_ASK_QUESTION = /\$\{AVAILABLE_TOOLS_SET\.has\(ASKUSERQUESTION_TOOL_NAME\)\?`[\s\S]*?`:""\}/g;
const REGEX_TODO_TOOL =
  /\$\{AVAILABLE_TOOLS_SET\.has\(TODO_TOOL_OBJECT\.name\)\?`Use the \$\{TODO_TOOL_OBJECT\.name\} tool to plan the task if required`:""\}/g;
const REGEX_ASKQUESTION_TOOL =
  /\$\{AVAILABLE_TOOLS_SET\.has\(ASKUSERQUESTION_TOOL_NAME\)\?`Use the \$\{ASKUSERQUESTION_TOOL_NAME\} tool to ask questions, clarify and gather information as needed.`:""\}/g;
const REGEX_TOOL_USAGE =
  /# Tool usage policy\$\{AVAILABLE_TOOLS_SET\.has\(TASK_TOOL_NAME\)\?`[\s\S]*?\$\{AGENT_TOOL_USAGE_NOTES\}`:""\}/g;
const REGEX_WEBFETCH_TOOL =
  /\$\{AGENT_TOOL_USAGE_NOTES\}`:""\}\$\{AVAILABLE_TOOLS_SET\.has\(WEBFETCH_TOOL_NAME\)\?`[\s\S]*?`:""\}/g;
const REGEX_CATCH_ALL = /\$\{AVAILABLE_TOOLS_SET\.has\([^)]+\)\?`[\s\S]*?`:""\}/g;

// Static replacements for incompatible template expressions
const REPLACEMENT_TASK_MANAGEMENT = `# Task Management

You have access to Task* tools to help you manage and plan tasks. Use these tools VERY frequently to ensure that you are tracking your tasks and giving the user visibility into your progress.

It is critical that you mark todos as completed as soon as you are done with a task.`;

const REPLACEMENT_ASK_QUESTION = `# Asking questions as you work

You have access to the AskUserQuestion tool to ask the user questions when you need clarification, want to validate assumptions, or need to make a decision you're unsure about.`;

const REPLACEMENT_TOOL_USAGE = `# Tool usage policy
- When doing file search, prefer to use the Task tool in order to reduce context usage.
- You should proactively use the Task tool with specialized agents when the task at hand matches the agent's description.`;

const isVersionIncompatible211 = (version: string): boolean => {
  return version === '2.1.1';
};

const patchProblematicPromptExpressions = (systemPromptsDir: string): void => {
  if (!fs.existsSync(systemPromptsDir)) return;

  const files = fs.readdirSync(systemPromptsDir).filter((f) => f.endsWith('.md'));

  for (const file of files) {
    const filePath = path.join(systemPromptsDir, file);
    let content: string;
    try {
      content = fs.readFileSync(filePath, 'utf8');
    } catch {
      console.warn(`Warning: Could not read prompt file: ${filePath}`);
      continue;
    }

    let modified = false;

    let before = content;
    content = content.replace(REGEX_TASK_MANAGEMENT, REPLACEMENT_TASK_MANAGEMENT);
    modified = modified || content !== before;

    before = content;
    content = content.replace(REGEX_ASK_QUESTION, REPLACEMENT_ASK_QUESTION);
    modified = modified || content !== before;

    before = content;
    content = content.replace(REGEX_TODO_TOOL, 'Use the TodoWrite tool to plan the task if required');
    modified = modified || content !== before;

    before = content;
    content = content.replace(
      REGEX_ASKQUESTION_TOOL,
      'Use the AskUserQuestion tool to ask questions, clarify and gather information as needed.'
    );
    modified = modified || content !== before;

    before = content;
    content = content.replace(REGEX_TOOL_USAGE, REPLACEMENT_TOOL_USAGE);
    modified = modified || content !== before;

    before = content;
    content = content.replace(REGEX_WEBFETCH_TOOL, '');
    modified = modified || content !== before;

    before = content;
    content = content.replace(REGEX_CATCH_ALL, '');
    modified = modified || content !== before;

    if (modified) {
      try {
        fs.writeFileSync(filePath, content);
      } catch {
        console.warn(`Warning: Could not write prompt file: ${filePath}`);
      }
    }
  }
};

export class TeamModeStep implements BuildStep {
  name = 'TeamMode';

  private shouldEnableTeamMode(ctx: BuildContext): boolean {
    return Boolean(ctx.params.enableTeamMode) || Boolean(ctx.provider.enablesTeamMode);
  }

  private getClaudeVersion(paths: { npmDir: string }): string {
    try {
      const packageJsonPath = path.join(paths.npmDir, 'node_modules', '@anthropic-ai', 'claude-code', 'package.json');
      if (fs.existsSync(packageJsonPath)) {
        const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        return pkg.version || '';
      }
    } catch {
      // ignore
    }
    return '';
  }

  execute(ctx: BuildContext): void {
    if (!this.shouldEnableTeamMode(ctx)) return;

    const version = this.getClaudeVersion(ctx.paths);
    const needsPromptPatch = isVersionIncompatible211(version);

    if (needsPromptPatch) {
      ctx.state.notes.push(`Applying prompt compatibility fixes for Claude Code ${version}`);
    }

    ctx.report('Enabling team mode...');
    this.patchCli(ctx, needsPromptPatch);
  }

  async executeAsync(ctx: BuildContext): Promise<void> {
    if (!this.shouldEnableTeamMode(ctx)) return;

    const version = this.getClaudeVersion(ctx.paths);
    const needsPromptPatch = isVersionIncompatible211(version);

    if (needsPromptPatch) {
      await ctx.report(`Applying prompt compatibility fixes for Claude Code ${version}`);
    }

    await ctx.report('Enabling team mode...');
    this.patchCli(ctx, needsPromptPatch);
  }

  private patchCli(ctx: BuildContext, needsPromptPatch: boolean): void {
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

    // Patch problematic template expressions for Claude Code 2.1.1
    if (needsPromptPatch) {
      patchProblematicPromptExpressions(systemPromptsDir);
      state.notes.push('Prompt compatibility patches applied for 2.1.1');
    }

    // Configure TweakCC toolset to block TodoWrite
    const tweakccConfigPath = path.join(paths.tweakDir, 'config.json');
    if (configureTeamToolset(tweakccConfigPath)) {
      state.notes.push('Team toolset configured (TodoWrite blocked)');
    }
  }
}
