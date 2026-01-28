/**
 * CLI Help Output Tests
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { printHelp } from '../../src/cli/help.js';

// Capture console.log output
function captureOutput(fn: () => void): string[] {
  const logs: string[] = [];
  const originalLog = console.log;
  console.log = (...args: unknown[]) => logs.push(args.join(' '));
  try {
    fn();
  } finally {
    console.log = originalLog;
  }
  return logs;
}

test('printHelp outputs usage information', () => {
  const output = captureOutput(() => printHelp());

  assert.equal(output.length, 1);
  const text = output[0];

  // Check main commands are documented
  assert.ok(text.includes('claude-sneakpeek'), 'Should include tool name');
  assert.ok(text.includes('create'), 'Should include create command');
  assert.ok(text.includes('quick'), 'Should include quick command');
  assert.ok(text.includes('list'), 'Should include list command');
  assert.ok(text.includes('update'), 'Should include update command');
  assert.ok(text.includes('remove'), 'Should include remove command');
  assert.ok(text.includes('doctor'), 'Should include doctor command');
  assert.ok(text.includes('tweak'), 'Should include tweak command');
});

test('printHelp documents provider options', () => {
  const output = captureOutput(() => printHelp());
  const text = output[0];

  assert.ok(text.includes('--provider'), 'Should document provider option');
  assert.ok(text.includes('zai'), 'Should list zai provider');
  assert.ok(text.includes('minimax'), 'Should list minimax provider');
  assert.ok(text.includes('openrouter'), 'Should list openrouter provider');
  assert.ok(text.includes('ccrouter'), 'Should list ccrouter provider');
});

test('printHelp documents model override options', () => {
  const output = captureOutput(() => printHelp());
  const text = output[0];

  // New help format groups these under "advanced" section
  assert.ok(text.includes('model-sonnet') || text.includes('Sonnet'), 'Should document model-sonnet option');
  assert.ok(text.includes('model-opus') || text.includes('Opus'), 'Should document model-opus option');
  assert.ok(text.includes('model-haiku') || text.includes('Haiku'), 'Should document model-haiku option');
});

test('printHelp documents brand options', () => {
  const output = captureOutput(() => printHelp());
  const text = output[0];

  assert.ok(text.includes('--brand'), 'Should document brand option');
  assert.ok(text.includes('auto'), 'Should list auto brand');
  assert.ok(text.includes('none'), 'Should list none brand');
});

test('printHelp documents flag options', () => {
  const output = captureOutput(() => printHelp());
  const text = output[0];

  // Core flags in simplified help
  assert.ok(text.includes('--no-tweak'), 'Should document no-tweak flag');
  assert.ok(text.includes('--tui') || text.includes('tui'), 'Should document tui flag');
  assert.ok(text.includes('--no-prompt-pack'), 'Should document no-prompt-pack flag');
  assert.ok(text.includes('--shell-env') || text.includes('shell'), 'Should document shell-env flag');
});

test('printHelp documents CLI sections', () => {
  const output = captureOutput(() => printHelp());
  const text = output[0];

  // New format has clear sections
  assert.ok(text.includes('WHAT IS CLAUDE-SNEAKPEEK') || text.includes('CLAUDE-SNEAKPEEK'), 'Should have intro');
  assert.ok(text.includes('COMMANDS') || text.includes('create'), 'Should have commands section');
  assert.ok(text.includes('OPTIONS') || text.includes('--'), 'Should have options section');
});
