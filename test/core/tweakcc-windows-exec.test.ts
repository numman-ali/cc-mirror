import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { runTweakcc } from '../../src/core/tweakcc.js';
import { cleanup, makeTempDir } from '../helpers/index.js';

test('runTweakcc can execute npx.cmd on Windows', { skip: process.platform !== 'win32' }, () => {
  const stubBin = makeTempDir();
  const tweakDir = makeTempDir();
  const prevPath = process.env.PATH;

  try {
    // Use a stub npx.cmd so the test stays offline and deterministic.
    const stubNpx = path.join(stubBin, 'npx.cmd');
    fs.writeFileSync(stubNpx, '@echo off\r\necho STUB_NPX\r\nexit /b 0\r\n', { encoding: 'utf8' });

    process.env.PATH = `${stubBin}${path.delimiter}${prevPath || ''}`;

    const result = runTweakcc(tweakDir, 'C:\\fake\\claude.exe', 'pipe');
    assert.equal(result.status, 0);
    assert.match(result.stdout ?? '', /STUB_NPX/i);
  } finally {
    process.env.PATH = prevPath;
    cleanup(stubBin);
    cleanup(tweakDir);
  }
});
