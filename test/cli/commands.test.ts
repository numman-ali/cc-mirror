import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import type { ParsedArgs } from '../../src/cli/args.js';
import { runDoctorCommand } from '../../src/cli/commands/doctorCmd.js';
import { runListCommand } from '../../src/cli/commands/list.js';
import { runRemoveCommand } from '../../src/cli/commands/remove.js';
import { getWrapperPath, getWrapperScriptPath, isWindows } from '../../src/core/paths.js';
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

test('runListCommand supports --json', () => {
  const root = makeTempDir();
  const bin = makeTempDir();
  const consoleCapture = captureConsole();

  try {
    writeVariant(root, 'alpha');
    const opts: ParsedArgs = { _: [], env: [], root, 'bin-dir': bin, json: true };
    runListCommand({ opts });

    const text = consoleCapture.logs.join('\n');
    const payload = JSON.parse(text) as Array<{ name: string; wrapperPath?: string }>;
    assert.equal(payload.length, 1);
    assert.equal(payload[0].name, 'alpha');
    assert.equal(payload[0].wrapperPath, getWrapperPath(bin, 'alpha'));
  } finally {
    consoleCapture.restore();
    cleanup(root);
    cleanup(bin);
  }
});

test('runListCommand supports --full', () => {
  const root = makeTempDir();
  const bin = makeTempDir();
  const consoleCapture = captureConsole();

  try {
    writeVariant(root, 'alpha');
    const opts: ParsedArgs = { _: [], env: [], root, 'bin-dir': bin, full: true };
    runListCommand({ opts });

    assert.equal(consoleCapture.logs.length, 1);
    assert.ok(consoleCapture.logs[0].includes('alpha'));
    assert.ok(consoleCapture.logs[0].includes('\tzai\t'));
    assert.ok(consoleCapture.logs[0].includes(getWrapperPath(bin, 'alpha')));
  } finally {
    consoleCapture.restore();
    cleanup(root);
    cleanup(bin);
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

test('runDoctorCommand supports --json', () => {
  const root = makeTempDir();
  const bin = makeTempDir();
  const consoleCapture = captureConsole();

  try {
    const opts: ParsedArgs = { _: [], env: [], root, 'bin-dir': bin, json: true };
    runDoctorCommand({ opts });
    const text = consoleCapture.logs.join('\n').trim();
    assert.equal(text, '[]');
  } finally {
    consoleCapture.restore();
    cleanup(root);
    cleanup(bin);
  }
});

test('runDoctorCommand supports --live', () => {
  const root = makeTempDir();
  const bin = makeTempDir();
  const consoleCapture = captureConsole();

  try {
    const name = 'alpha';
    const variantDir = path.join(root, name);
    const nativeDir = path.join(variantDir, 'native');
    fs.mkdirSync(nativeDir, { recursive: true });

    const binaryPath = path.join(nativeDir, process.platform === 'win32' ? 'claude.exe' : 'claude');
    fs.writeFileSync(binaryPath, 'fake');

    const configDir = path.join(variantDir, 'config');
    const tweakDir = path.join(variantDir, 'tweakcc');
    fs.mkdirSync(configDir, { recursive: true });
    fs.mkdirSync(tweakDir, { recursive: true });

    const meta = {
      name,
      provider: 'zai',
      createdAt: new Date().toISOString(),
      claudeOrig: 'native:0.0.0',
      nativeVersion: 'stable',
      binaryPath,
      configDir,
      tweakDir,
      binDir: bin,
    };
    fs.writeFileSync(path.join(variantDir, 'variant.json'), JSON.stringify(meta));

    const wrapperPath = getWrapperPath(bin, name);
    fs.mkdirSync(bin, { recursive: true });
    if (isWindows) {
      fs.writeFileSync(wrapperPath, '@echo off\r\necho pong\r\n');
      fs.writeFileSync(getWrapperScriptPath(bin, name), 'console.log("pong");\n');
    } else {
      fs.writeFileSync(wrapperPath, '#!/usr/bin/env bash\necho pong\n');
      fs.chmodSync(wrapperPath, 0o755);
    }

    const opts: ParsedArgs = {
      _: [],
      env: [],
      root,
      'bin-dir': bin,
      live: true,
      json: true,
      prompt: 'Reply with exactly: pong',
      'timeout-ms': '2000',
    };
    runDoctorCommand({ opts });

    const text = consoleCapture.logs.join('\n');
    const payload = JSON.parse(text) as Array<{ name: string; liveOk?: boolean }>;
    assert.equal(payload.length, 1);
    assert.equal(payload[0].name, name);
    assert.equal(payload[0].liveOk, true);
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
