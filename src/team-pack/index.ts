/**
 * Team Pack - Enhanced prompts for Team Mode
 *
 * These prompts are copied to tweakDir/system-prompts/ when Team Mode is enabled.
 * They provide enhanced guidance for Task* tools without TodoWrite references.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const TEAM_PACK_FILES = [
  { source: 'tasklist.md', target: 'tool-description-tasklist.md' },
  { source: 'taskupdate.md', target: 'tool-description-taskupdate.md' },
  { source: 'task-extra-notes.md', target: 'agent-prompt-task-tool-extra-notes.md' },
  { source: 'task-management-note.md', target: 'system-prompt-task-management-note.md' },
  { source: 'orchestration-skill.md', target: 'system-prompt-orchestration-skill.md' },
  { source: 'skill-tool-override.md', target: 'tool-description-skill.md' },
];

/**
 * Copy team pack prompt files to the tweakcc system-prompts directory
 */
export const copyTeamPackPrompts = (systemPromptsDir: string): string[] => {
  const copied: string[] = [];

  if (!fs.existsSync(systemPromptsDir)) {
    fs.mkdirSync(systemPromptsDir, { recursive: true });
  }

  for (const file of TEAM_PACK_FILES) {
    const sourcePath = path.join(__dirname, file.source);
    const targetPath = path.join(systemPromptsDir, file.target);

    if (fs.existsSync(sourcePath)) {
      fs.copyFileSync(sourcePath, targetPath);
      copied.push(file.target);
    }
  }

  return copied;
};

/**
 * Remove team pack prompt files from the tweakcc system-prompts directory
 */
export const removeTeamPackPrompts = (systemPromptsDir: string): string[] => {
  const removed: string[] = [];

  if (!fs.existsSync(systemPromptsDir)) {
    return removed;
  }

  for (const file of TEAM_PACK_FILES) {
    const targetPath = path.join(systemPromptsDir, file.target);
    if (fs.existsSync(targetPath)) {
      fs.unlinkSync(targetPath);
      removed.push(file.target);
    }
  }

  return removed;
};

/**
 * Configure TweakCC toolset to disable TodoWrite for Team Mode
 * Merges blocked tools from the existing default toolset with TodoWrite
 */
export const configureTeamToolset = (configPath: string): boolean => {
  if (!fs.existsSync(configPath)) {
    return false;
  }

  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

    // Ensure settings object exists
    config.settings = config.settings || {};

    // Get existing toolsets
    const toolsets = Array.isArray(config.settings.toolsets) ? config.settings.toolsets : [];

    // Find existing default toolset to inherit its blocked tools
    const defaultToolsetName = config.settings.defaultToolset;
    const existingDefaultToolset = toolsets.find(
      (t: { name: string; blockedTools?: string[] }) => t.name === defaultToolsetName
    );

    // Merge existing blocked tools with TodoWrite
    const existingBlockedTools: string[] = existingDefaultToolset?.blockedTools || [];
    const mergedBlockedTools = [...new Set([...existingBlockedTools, 'TodoWrite'])];

    // Create or update team toolset
    const teamToolset = {
      name: 'team',
      allowedTools: '*' as const,
      blockedTools: mergedBlockedTools,
    };

    // Find and update or add team toolset
    const existingTeamIndex = toolsets.findIndex((t: { name: string }) => t.name === 'team');
    if (existingTeamIndex >= 0) {
      toolsets[existingTeamIndex] = teamToolset;
    } else {
      toolsets.push(teamToolset);
    }

    config.settings.toolsets = toolsets;
    config.settings.defaultToolset = 'team';
    config.settings.planModeToolset = 'team';

    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    return true;
  } catch {
    return false;
  }
};

/**
 * Remove the team toolset and restore defaults where possible
 */
export const removeTeamToolset = (configPath: string): boolean => {
  if (!fs.existsSync(configPath)) {
    return false;
  }

  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    config.settings = config.settings || {};

    const toolsets = Array.isArray(config.settings.toolsets) ? config.settings.toolsets : [];
    const nextToolsets = toolsets.filter((t: { name?: string }) => t?.name !== 'team');

    const fallbackName = nextToolsets[0]?.name;
    if (config.settings.defaultToolset === 'team') {
      if (fallbackName) {
        config.settings.defaultToolset = fallbackName;
      } else {
        delete config.settings.defaultToolset;
      }
    }
    if (config.settings.planModeToolset === 'team') {
      if (fallbackName) {
        config.settings.planModeToolset = fallbackName;
      } else {
        delete config.settings.planModeToolset;
      }
    }

    config.settings.toolsets = nextToolsets;

    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    return true;
  } catch {
    return false;
  }
};
