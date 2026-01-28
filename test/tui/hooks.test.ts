/**
 * TUI Hooks Unit Tests
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { buildCreateSummary, buildCreateNextSteps, buildHelpLines } from '../../src/tui/hooks/useVariantCreate.js';
import { buildUpdateSummary, buildUpdateNextSteps } from '../../src/tui/hooks/useVariantUpdate.js';

test('buildCreateSummary includes all expected fields', () => {
  const summary = buildCreateSummary({
    providerLabel: 'Zai Cloud',
    npmPackage: '@anthropic-ai/claude-code',
    npmVersion: '2.1.12',
    usePromptPack: true,
    installSkill: true,
    enableTeamMode: true,
    teamModeSupported: true,
    modelOverrides: { sonnet: 'model-a', opus: 'model-b', haiku: 'model-c' },
    providerKey: 'zai',
    shellEnv: true,
    notes: ['Note 1'],
  });

  assert.ok(summary.some((line) => line.includes('Zai Cloud')));
  assert.ok(summary.some((line) => line.includes('@anthropic-ai/claude-code')));
  assert.ok(summary.some((line) => line.includes('Prompt pack: on (zai-cli routing)')));
  assert.ok(summary.some((line) => line.includes('dev-browser skill: on')));
  assert.ok(summary.some((line) => line.includes('Team mode: on')));
  assert.ok(summary.some((line) => line.includes('orchestrator skill')));
  assert.ok(summary.some((line) => line.includes('Models:')));
  assert.ok(summary.some((line) => line.includes('Shell env:')));
  assert.ok(summary.some((line) => line.includes('Note 1')));
});

test('buildCreateSummary omits models when not set', () => {
  const summary = buildCreateSummary({
    providerLabel: 'OpenRouter',
    npmPackage: '@anthropic-ai/claude-code',
    npmVersion: '2.1.12',
    usePromptPack: false,
    installSkill: false,
    enableTeamMode: false,
    teamModeSupported: true,
    modelOverrides: {},
    providerKey: 'openrouter',
    shellEnv: false,
  });

  assert.ok(!summary.some((line) => line.includes('Models:')));
  assert.ok(!summary.some((line) => line.includes('Shell env:')));
  assert.ok(summary.some((line) => line.includes('Team mode: off')));
});

test('buildCreateSummary shows prompt pack off when disabled', () => {
  const summary = buildCreateSummary({
    providerLabel: 'Custom',
    npmPackage: '@anthropic-ai/claude-code',
    npmVersion: '2.1.12',
    usePromptPack: false,
    installSkill: false,
    enableTeamMode: false,
    teamModeSupported: true,
    modelOverrides: {},
    providerKey: 'custom',
    shellEnv: false,
  });

  assert.ok(summary.some((line) => line.includes('Prompt pack: off')));
});

test('buildCreateSummary shows provider-specific prompt pack routing', () => {
  // MiniMax should show MCP routing
  const minimaxSummary = buildCreateSummary({
    providerLabel: 'MiniMax',
    npmPackage: '@anthropic-ai/claude-code',
    npmVersion: '2.1.12',
    usePromptPack: true,
    installSkill: false,
    enableTeamMode: false,
    teamModeSupported: true,
    modelOverrides: {},
    providerKey: 'minimax',
    shellEnv: false,
  });

  assert.ok(minimaxSummary.some((line) => line.includes('Prompt pack: on (MCP routing)')));
});

test('buildCreateNextSteps includes variant name and paths', () => {
  const rootDir = path.join(path.sep, 'home', 'user', '.claude-sneakpeek');
  const steps = buildCreateNextSteps('my-variant', rootDir);

  assert.ok(steps.some((line) => line.includes('Run: my-variant')));
  assert.ok(steps.some((line) => line.includes('Update: claude-sneakpeek update my-variant')));
  assert.ok(steps.some((line) => line.includes('Tweak: claude-sneakpeek tweak my-variant')));
  assert.ok(steps.some((line) => line.includes('Config:')));
  assert.ok(steps.some((line) => line.includes(rootDir)));
});

test('buildHelpLines returns standard help commands', () => {
  const help = buildHelpLines();

  assert.equal(help.length, 3);
  assert.ok(help.some((line) => line.includes('claude-sneakpeek help')));
  assert.ok(help.some((line) => line.includes('claude-sneakpeek list')));
  assert.ok(help.some((line) => line.includes('claude-sneakpeek doctor')));
});

// Helper to create a valid VariantMeta for testing
function makeTestMeta(
  overrides: Partial<{
    name: string;
    provider: string;
    promptPack: boolean;
    promptPackMode: 'minimal' | 'maximal';
    skillInstall: boolean;
    shellEnv: boolean;
    teamModeEnabled: boolean;
  }>
) {
  return {
    name: 'test',
    provider: 'test',
    createdAt: new Date().toISOString(),
    claudeOrig: '/path/to/claude',
    binaryPath: '/path/to/binary',
    configDir: '/path/to/config',
    tweakDir: '/path/to/tweak',
    ...overrides,
  };
}

test('buildUpdateSummary includes provider info', () => {
  const summary = buildUpdateSummary(
    makeTestMeta({
      provider: 'zai',
      promptPack: true,
      promptPackMode: 'maximal',
      skillInstall: true,
      shellEnv: true,
      teamModeEnabled: true,
    }),
    ['Update note'],
    true
  );

  assert.ok(summary.some((line) => line.includes('Provider: zai')));
  assert.ok(summary.some((line) => line.includes('Prompt pack: on (zai-cli routing)')));
  assert.ok(summary.some((line) => line.includes('dev-browser skill: on')));
  assert.ok(summary.some((line) => line.includes('Team mode: on')));
  assert.ok(summary.some((line) => line.includes('orchestrator skill')));
  assert.ok(summary.some((line) => line.includes('Shell env:')));
  assert.ok(summary.some((line) => line.includes('Update note')));
});

test('buildUpdateSummary omits shell env for non-zai providers', () => {
  const summary = buildUpdateSummary(
    makeTestMeta({
      provider: 'minimax',
      promptPack: true,
      skillInstall: false,
      shellEnv: false,
      teamModeEnabled: false,
    }),
    undefined,
    true
  );

  assert.ok(!summary.some((line) => line.includes('Shell env:')));
  assert.ok(summary.some((line) => line.includes('Prompt pack: on (MCP routing)')));
  assert.ok(summary.some((line) => line.includes('Team mode: off')));
});

test('buildUpdateNextSteps includes variant operations', () => {
  const rootDir = path.join(path.sep, 'home', 'user', '.claude-sneakpeek');
  const steps = buildUpdateNextSteps('my-variant', rootDir);

  assert.ok(steps.some((line) => line.includes('Run: my-variant')));
  assert.ok(steps.some((line) => line.includes('Tweak: claude-sneakpeek tweak my-variant')));
  assert.ok(steps.some((line) => line.includes('Config:')));
});
