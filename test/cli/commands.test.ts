import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import type { ParsedArgs } from '../../src/cli/args.js';
import { runDoctorCommand } from '../../src/cli/commands/doctorCmd.js';
import { runListCommand } from '../../src/cli/commands/list.js';
import { runRemoveCommand } from '../../src/cli/commands/remove.js';
import { cleanup, makeTempDir } from '../helpers/fs-helpers.js';

const captureConsole = () => {
  const logs: string[] = [];
  const errors: string[] = [];
  const originalLog = console.log;
  const originalError = console.error;

  console.log = (...args: unknown[]) => {
    logs.push(args.join(' '));
  };
  console.error = (...args: unknown[]) => {
    errors.push(args.join(' '));
  };

  return {
    logs,
    errors,
    restore: () => {
      console.log = originalLog;
      console.error = originalError;
    },
  };
};

const writeVariant = (rootDir: string, name: string) => {
  const variantDir = path.join(rootDir, name);
  fs.mkdirSync(variantDir, { recursive: true });
  const meta = {
    name,
    provider: 'zai',
    createdAt: new Date().toISOString(),
    claudeOrig: '/tmp/claude',
    binaryPath: '/tmp/claude/bin/cli.js',
    configDir: '/tmp/claude/config',
    tweakDir: '/tmp/claude/tweak',
  };
  fs.writeFileSync(path.join(variantDir, 'variant.json'), JSON.stringify(meta));
};

test('runListCommand reports when no variants exist', () => {
  const root = makeTempDir();
  const consoleCapture = captureConsole();

  try {
    const opts: ParsedArgs = { _: [], env: [], root };
    runListCommand({ opts });
    assert.equal(consoleCapture.logs.length, 1);
    assert.equal(consoleCapture.logs[0], `No variants found in ${root}`);
  } finally {
    consoleCapture.restore();
    cleanup(root);
  }
});

test('runListCommand prints variant names', () => {
  const root = makeTempDir();
  const consoleCapture = captureConsole();

  try {
    writeVariant(root, 'alpha');
    writeVariant(root, 'beta');

    const opts: ParsedArgs = { _: [], env: [], root };
    runListCommand({ opts });

    const names = consoleCapture.logs.slice().sort();
    assert.deepEqual(names, ['alpha', 'beta']);
  } finally {
    consoleCapture.restore();
    cleanup(root);
  }
});

test('runDoctorCommand prints empty report message', () => {
  const root = makeTempDir();
  const bin = makeTempDir();
  const consoleCapture = captureConsole();

  try {
    const opts: ParsedArgs = { _: [], env: [], root, 'bin-dir': bin };
    runDoctorCommand({ opts });
    assert.equal(consoleCapture.logs[0], 'No variants found.');
  } finally {
    consoleCapture.restore();
    cleanup(root);
    cleanup(bin);
  }
});

test('runRemoveCommand removes variant and logs output', () => {
  const root = makeTempDir();
  const consoleCapture = captureConsole();

  try {
    fs.mkdirSync(path.join(root, 'alpha'), { recursive: true });
    const opts: ParsedArgs = { _: ['alpha'], env: [], root };
    runRemoveCommand({ opts });
    assert.equal(fs.existsSync(path.join(root, 'alpha')), false);
    assert.equal(consoleCapture.logs[0], 'Removed alpha');
  } finally {
    consoleCapture.restore();
    cleanup(root);
  }
});
