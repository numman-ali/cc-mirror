/**
 * Print variant operation summary to console
 */

import type { VariantMeta } from '../../core/types.js';
import { TEAM_MODE_SUPPORTED } from '../../core/constants.js';

export interface PrintSummaryOptions {
  action: string;
  meta: VariantMeta;
  wrapperPath?: string;
  notes?: string[];
}

export function printSummary(opts: PrintSummaryOptions): void {
  const { action, meta, wrapperPath, notes } = opts;

  // Helper to get prompt pack description with provider-specific routing info
  const getPromptPackDescription = (): string => {
    if (!meta.promptPack) return 'off';
    if (meta.provider === 'zai') return 'on (zai-cli routing)';
    if (meta.provider === 'minimax') return 'on (MCP routing)';
    return 'on';
  };

  // Helper to get team mode description
  const getTeamModeDescription = (): string => {
    if (!meta.teamModeEnabled) return 'off';
    return 'on (orchestrator skill, TodoWrite blocked)';
  };

  // Header
  console.log('');
  console.log(`✓ ${action}: ${meta.name}`);
  console.log(`  Provider: ${meta.provider}`);

  // Optional features
  if (meta.promptPack !== undefined) {
    console.log(`  Prompt pack: ${getPromptPackDescription()}`);
  }
  if (meta.skillInstall !== undefined) {
    console.log(`  dev-browser skill: ${meta.skillInstall ? 'on' : 'off'}`);
  }
  if (meta.teamModeEnabled !== undefined) {
    const teamModeDescription = TEAM_MODE_SUPPORTED ? getTeamModeDescription() : 'unsupported (use cc-mirror 1.6.3)';
    console.log(`  Team mode: ${teamModeDescription}`);
  }
  if (meta.shellEnv !== undefined && meta.provider === 'zai') {
    console.log(`  Shell env: ${meta.shellEnv ? 'write Z_AI_API_KEY' : 'manual'}`);
  }

  // Paths
  if (wrapperPath) console.log(`  Wrapper: ${wrapperPath}`);
  if (meta.configDir) console.log(`  Config: ${meta.configDir}`);

  // Notes
  if (notes && notes.length > 0) {
    console.log('');
    for (const note of notes) console.log(`  • ${note}`);
  }

  // Next steps
  console.log('');
  console.log(`  Run: ${meta.name}`);
  console.log('');
}
