/**
 * Tests for CLI utility functions
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildShareUrl,
  getModelOverridesFromArgs,
  formatModelNote,
  parsePromptPackMode,
  buildExtraEnv,
  printSummary,
} from '../../src/cli/utils/index.js';
import type { ParsedArgs } from '../../src/cli/args.js';
import type { VariantMeta } from '../../src/core/types.js';

// Helper to create minimal ParsedArgs
function createOpts(overrides: Partial<ParsedArgs> = {}): ParsedArgs {
  return { _: [], env: [], ...overrides };
}

// Helper to create minimal VariantMeta for testing
function createMeta(overrides: Partial<VariantMeta> = {}): VariantMeta {
  return {
    name: 'test',
    provider: 'zai',
    createdAt: new Date().toISOString(),
    claudeOrig: '/path/to/claude',
    binaryPath: '/path/to/binary',
    configDir: '/config',
    tweakDir: '/tweak',
    ...overrides,
  };
}

// buildShareUrl tests
test('buildShareUrl creates valid Twitter intent URL', () => {
  const url = buildShareUrl('ZAI', 'zai', 'maximal');
  assert.ok(url.startsWith('https://x.com/intent/tweet'));
  assert.ok(url.includes('text='));
  assert.ok(decodeURIComponent(url).includes('ZAI'));
  assert.ok(decodeURIComponent(url).includes('zai'));
  assert.ok(decodeURIComponent(url).includes('maximal'));
});

test('buildShareUrl works without mode', () => {
  const url = buildShareUrl('OpenRouter', 'openrouter');
  assert.ok(url.startsWith('https://x.com/intent/tweet'));
  // URL uses + for spaces, so check for the pattern
  assert.ok(url.includes('Prompt+pack'));
  assert.ok(url.includes('enabled'));
});

test('buildShareUrl includes minimal mode', () => {
  const url = buildShareUrl('MiniMax', 'minimax', 'minimal');
  assert.ok(url.includes('Prompt+pack'));
  assert.ok(url.includes('minimal'));
});

// getModelOverridesFromArgs tests
test('getModelOverridesFromArgs extracts all model overrides', () => {
  const opts = createOpts({
    'model-sonnet': 'claude-3-sonnet-v2',
    'model-opus': 'claude-3-opus',
    'model-haiku': 'claude-3-haiku',
    'model-small-fast': 'claude-3-5-haiku',
    'model-default': 'default-model',
    'model-subagent': 'subagent-model',
  });
  const overrides = getModelOverridesFromArgs(opts);
  assert.equal(overrides.sonnet, 'claude-3-sonnet-v2');
  assert.equal(overrides.opus, 'claude-3-opus');
  assert.equal(overrides.haiku, 'claude-3-haiku');
  assert.equal(overrides.smallFast, 'claude-3-5-haiku');
  assert.equal(overrides.defaultModel, 'default-model');
  assert.equal(overrides.subagentModel, 'subagent-model');
});

test('getModelOverridesFromArgs handles missing values', () => {
  const opts = createOpts({ 'model-sonnet': 'only-sonnet' });
  const overrides = getModelOverridesFromArgs(opts);
  assert.equal(overrides.sonnet, 'only-sonnet');
  assert.equal(overrides.opus, undefined);
  assert.equal(overrides.haiku, undefined);
});

test('getModelOverridesFromArgs ignores non-string values', () => {
  const opts = createOpts({ 'model-sonnet': true, 'model-opus': 123 as unknown as string });
  const overrides = getModelOverridesFromArgs(opts);
  assert.equal(overrides.sonnet, undefined);
  assert.equal(overrides.opus, undefined);
});

test('getModelOverridesFromArgs supports --model convenience flag', () => {
  const opts = createOpts({ model: 'anthropic/claude-3.5-sonnet' as unknown as string });
  const overrides = getModelOverridesFromArgs(opts);
  assert.equal(overrides.sonnet, 'anthropic/claude-3.5-sonnet');
  assert.equal(overrides.opus, 'anthropic/claude-3.5-sonnet');
  assert.equal(overrides.haiku, 'anthropic/claude-3.5-sonnet');
});

test('getModelOverridesFromArgs prefers explicit tier flags over --model', () => {
  const opts = createOpts({ model: 'all', 'model-sonnet': 'sonnet-only' });
  const overrides = getModelOverridesFromArgs(opts);
  assert.equal(overrides.sonnet, 'sonnet-only');
  assert.equal(overrides.opus, 'all');
  assert.equal(overrides.haiku, 'all');
});

// formatModelNote tests
test('formatModelNote returns null for empty overrides', () => {
  const result = formatModelNote({});
  assert.equal(result, null);
});

test('formatModelNote formats single override', () => {
  const result = formatModelNote({ sonnet: 'claude-3-sonnet' });
  assert.equal(result, 'Model mapping: sonnet=claude-3-sonnet');
});

test('formatModelNote formats multiple overrides', () => {
  const result = formatModelNote({
    sonnet: 'claude-3-sonnet',
    opus: 'claude-3-opus',
    haiku: 'claude-3-haiku',
  });
  assert.ok(result?.includes('sonnet=claude-3-sonnet'));
  assert.ok(result?.includes('opus=claude-3-opus'));
  assert.ok(result?.includes('haiku=claude-3-haiku'));
});

test('formatModelNote ignores empty string values', () => {
  const result = formatModelNote({ sonnet: '', opus: 'claude-3-opus' });
  assert.equal(result, 'Model mapping: opus=claude-3-opus');
});

test('formatModelNote ignores whitespace-only values', () => {
  const result = formatModelNote({ sonnet: '   ', opus: 'claude-3-opus' });
  assert.equal(result, 'Model mapping: opus=claude-3-opus');
});

// parsePromptPackMode tests
test('parsePromptPackMode returns minimal for minimal', () => {
  assert.equal(parsePromptPackMode('minimal'), 'minimal');
});

test('parsePromptPackMode returns undefined for deprecated maximal', () => {
  // maximal is deprecated and no longer supported
  assert.equal(parsePromptPackMode('maximal'), undefined);
});

test('parsePromptPackMode is case-insensitive for minimal', () => {
  assert.equal(parsePromptPackMode('MINIMAL'), 'minimal');
  assert.equal(parsePromptPackMode('Minimal'), 'minimal');
});

test('parsePromptPackMode returns undefined for undefined', () => {
  assert.equal(parsePromptPackMode(undefined), undefined);
});

test('parsePromptPackMode returns undefined for empty string', () => {
  assert.equal(parsePromptPackMode(''), undefined);
});

test('parsePromptPackMode returns undefined for invalid values', () => {
  assert.equal(parsePromptPackMode('invalid'), undefined);
  assert.equal(parsePromptPackMode('medium'), undefined);
});

// buildExtraEnv tests
test('buildExtraEnv returns empty array when no env', () => {
  const result = buildExtraEnv(createOpts());
  assert.deepEqual(result, []);
});

test('buildExtraEnv returns env array as-is', () => {
  const result = buildExtraEnv(createOpts({ env: ['FOO=bar', 'BAZ=qux'] }));
  assert.deepEqual(result, ['FOO=bar', 'BAZ=qux']);
});

test('buildExtraEnv adds timeout-ms to env', () => {
  const result = buildExtraEnv(createOpts({ 'timeout-ms': '30000' }));
  assert.deepEqual(result, ['API_TIMEOUT_MS=30000']);
});

test('buildExtraEnv combines env and timeout', () => {
  const result = buildExtraEnv(createOpts({ env: ['FOO=bar'], 'timeout-ms': '5000' }));
  assert.deepEqual(result, ['FOO=bar', 'API_TIMEOUT_MS=5000']);
});

test('buildExtraEnv ignores empty timeout', () => {
  const result = buildExtraEnv(createOpts({ 'timeout-ms': '' }));
  assert.deepEqual(result, []);
});

test('buildExtraEnv ignores whitespace timeout', () => {
  const result = buildExtraEnv(createOpts({ 'timeout-ms': '   ' }));
  assert.deepEqual(result, []);
});

// printSummary tests (capture console output)
test('printSummary prints basic info', () => {
  const logs: string[] = [];
  const originalLog = console.log;
  console.log = (...args: unknown[]) => logs.push(args.join(' '));

  try {
    printSummary({
      action: 'Created',
      meta: createMeta({ name: 'test-variant' }),
    });

    assert.ok(logs.some((line) => line.includes('✓ Created: test-variant')));
    assert.ok(logs.some((line) => line.includes('Provider: zai')));
    assert.ok(logs.some((line) => line.includes('Config: /config')));
    assert.ok(logs.some((line) => line.includes('Run: test-variant')));
  } finally {
    console.log = originalLog;
  }
});

test('printSummary prints prompt pack when enabled', () => {
  const logs: string[] = [];
  const originalLog = console.log;
  console.log = (...args: unknown[]) => logs.push(args.join(' '));

  try {
    printSummary({
      action: 'Updated',
      meta: createMeta({
        provider: 'minimax',
        promptPack: true,
        promptPackMode: 'minimal',
      }),
    });

    // MiniMax shows MCP routing info
    assert.ok(logs.some((line) => line.includes('Prompt pack: on (MCP routing)')));
  } finally {
    console.log = originalLog;
  }
});

test('printSummary prints shell env for zai provider', () => {
  const logs: string[] = [];
  const originalLog = console.log;
  console.log = (...args: unknown[]) => logs.push(args.join(' '));

  try {
    printSummary({
      action: 'Created',
      meta: createMeta({ shellEnv: true }),
    });

    assert.ok(logs.some((line) => line.includes('Shell env: write Z_AI_API_KEY')));
  } finally {
    console.log = originalLog;
  }
});

test('printSummary prints notes when provided', () => {
  const logs: string[] = [];
  const originalLog = console.log;
  console.log = (...args: unknown[]) => logs.push(args.join(' '));

  try {
    printSummary({
      action: 'Created',
      meta: createMeta(),
      notes: ['First note', 'Second note'],
    });

    assert.ok(logs.some((line) => line.includes('• First note')));
    assert.ok(logs.some((line) => line.includes('• Second note')));
  } finally {
    console.log = originalLog;
  }
});

test('printSummary prints wrapper path when provided', () => {
  const logs: string[] = [];
  const originalLog = console.log;
  console.log = (...args: unknown[]) => logs.push(args.join(' '));

  try {
    printSummary({
      action: 'Created',
      meta: createMeta(),
      wrapperPath: '/usr/local/bin/test',
    });

    assert.ok(logs.some((line) => line.includes('Wrapper: /usr/local/bin/test')));
  } finally {
    console.log = originalLog;
  }
});

test('printSummary prints skill install status', () => {
  const logs: string[] = [];
  const originalLog = console.log;
  console.log = (...args: unknown[]) => logs.push(args.join(' '));

  try {
    printSummary({
      action: 'Created',
      meta: createMeta({ skillInstall: true }),
    });

    assert.ok(logs.some((line) => line.includes('dev-browser skill: on')));
  } finally {
    console.log = originalLog;
  }
});
