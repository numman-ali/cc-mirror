import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import * as core from '../../src/core/index.js';
import { cleanup, makeTempDir } from '../helpers/index.js';

test('createVariantAsync runs tweakcc when enabled (via stubbed npx)', async () => {
  const rootDir = makeTempDir();
  const binDir = makeTempDir();
  const stubBin = makeTempDir();
  const prevPath = process.env.PATH;

  try {
    if (process.platform === 'win32') {
      // GitHub Actions Windows runners expect .cmd shims for npm/npx.
      const stubNpx = path.join(stubBin, 'npx.cmd');
      fs.writeFileSync(stubNpx, '@echo off\r\necho STUB_NPX_CREATE\r\nexit /b 0\r\n', { encoding: 'utf8' });
    } else {
      const stubNpx = path.join(stubBin, 'npx');
      fs.writeFileSync(stubNpx, '#!/usr/bin/env bash\necho STUB_NPX_CREATE\nexit 0\n', {
        encoding: 'utf8',
        mode: 0o755,
      });
    }

    process.env.PATH = `${stubBin}${path.delimiter}${prevPath || ''}`;

    const result = await core.createVariantAsync({
      name: 'tweakcc-stub',
      providerKey: 'minimax',
      apiKey: '',
      claudeVersion: 'stable',
      rootDir,
      binDir,
      // Ensure tweakcc actually runs; keep prompt pack off so we only invoke tweakcc once.
      noTweak: false,
      promptPack: false,
      skillInstall: false,
      tweakccStdio: 'pipe',
    });

    assert.ok(result.tweakResult, 'Expected tweakResult to be populated when noTweak=false');
    assert.equal(result.tweakResult?.status, 0);

    const combined = `${result.tweakResult?.stdout ?? ''}${result.tweakResult?.stderr ?? ''}`;
    assert.match(combined, /STUB_NPX_CREATE/i);
  } finally {
    process.env.PATH = prevPath;
    cleanup(rootDir);
    cleanup(binDir);
    cleanup(stubBin);
  }
});
