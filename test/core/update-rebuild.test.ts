/**
 * Update rebuild step tests
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { RebuildUpdateStep } from '../../src/core/variant-builder/update-steps/RebuildUpdateStep.js';
import type { UpdateContext } from '../../src/core/variant-builder/types.js';
import { getWrapperPath, getWrapperScriptPath, isWindows } from '../../src/core/paths.js';
import { makeTempDir, cleanup } from '../helpers/index.js';

const createContext = (rootDir: string, binDir: string, opts: UpdateContext['opts']): UpdateContext => {
  const name = 'alpha';
  const variantDir = path.join(rootDir, name);
  const configDir = path.join(variantDir, 'config');
  const tweakDir = path.join(variantDir, 'tweakcc');
  const npmDir = path.join(variantDir, 'npm');

  const meta = {
    name,
    provider: 'zai',
    createdAt: new Date().toISOString(),
    claudeOrig: 'npm:@anthropic-ai/claude-code@2.1.12',
    binaryPath: path.join(npmDir, 'node_modules', '@anthropic-ai', 'claude-code', 'cli.js'),
    configDir,
    tweakDir,
    binDir,
    npmDir,
    brand: 'zai',
  } as UpdateContext['meta'];

  const ctx: UpdateContext = {
    name,
    opts,
    meta,
    paths: {
      resolvedRoot: rootDir,
      resolvedBin: binDir,
      variantDir,
      npmDir,
    },
    prefs: {
      resolvedNpmPackage: '@anthropic-ai/claude-code',
      resolvedNpmVersion: '2.1.12',
      promptPackPreference: true,
      promptPackEnabled: true,
      skillInstallEnabled: true,
      shellEnvEnabled: true,
      skillUpdateEnabled: false,
      commandStdio: 'pipe',
    },
    state: {
      notes: [],
      tweakResult: null,
      brandKey: meta.brand ?? null,
    },
    report: () => {},
    isAsync: false,
  };

  return ctx;
};

test('RebuildUpdateStep resets npm/tweakcc but preserves config', () => {
  const rootDir = makeTempDir('update-rebuild-');
  const binDir = makeTempDir('update-bin-');

  try {
    const ctx = createContext(rootDir, binDir, {});
    const { meta, paths } = ctx;

    fs.mkdirSync(meta.configDir, { recursive: true });
    fs.mkdirSync(path.join(meta.configDir, 'tasks', 'team-a'), { recursive: true });
    fs.writeFileSync(path.join(meta.configDir, 'tasks', 'team-a', '1.json'), '{}');

    fs.mkdirSync(meta.tweakDir, { recursive: true });
    fs.writeFileSync(path.join(meta.tweakDir, 'config.json'), JSON.stringify({ settings: { themes: [] } }, null, 2));
    fs.mkdirSync(path.join(meta.tweakDir, 'system-prompts'), { recursive: true });
    fs.writeFileSync(path.join(meta.tweakDir, 'system-prompts', 'old.md'), 'old');

    fs.mkdirSync(paths.npmDir, { recursive: true });
    fs.writeFileSync(path.join(paths.npmDir, 'marker.txt'), 'old');

    const wrapperPath = getWrapperPath(binDir, ctx.name);
    fs.writeFileSync(wrapperPath, 'wrapper');
    if (isWindows) {
      fs.writeFileSync(getWrapperScriptPath(binDir, ctx.name), 'wrapper-script');
    }

    new RebuildUpdateStep().execute(ctx);

    assert.equal(fs.existsSync(paths.npmDir), false, 'npm dir should be removed');
    assert.ok(fs.existsSync(meta.tweakDir), 'tweakcc dir should be recreated');
    assert.ok(fs.existsSync(path.join(meta.tweakDir, 'config.json')), 'tweakcc config should be preserved');
    assert.equal(
      fs.existsSync(path.join(meta.tweakDir, 'system-prompts', 'old.md')),
      false,
      'old tweakcc prompt files should be removed'
    );
    assert.equal(fs.existsSync(wrapperPath), false, 'wrapper should be removed');
    if (isWindows) {
      assert.equal(fs.existsSync(getWrapperScriptPath(binDir, ctx.name)), false, 'wrapper script should be removed');
    }
    assert.ok(fs.existsSync(path.join(meta.configDir, 'tasks', 'team-a', '1.json')), 'tasks should be preserved');
  } finally {
    cleanup(rootDir);
    cleanup(binDir);
  }
});

test('RebuildUpdateStep preserves tweakcc dir when noTweak is set', () => {
  const rootDir = makeTempDir('update-rebuild-');
  const binDir = makeTempDir('update-bin-');

  try {
    const ctx = createContext(rootDir, binDir, { noTweak: true });
    const { meta } = ctx;

    fs.mkdirSync(meta.tweakDir, { recursive: true });
    fs.writeFileSync(path.join(meta.tweakDir, 'config.json'), JSON.stringify({ settings: { themes: [] } }, null, 2));
    fs.writeFileSync(path.join(meta.tweakDir, 'marker.txt'), 'keep');

    new RebuildUpdateStep().execute(ctx);

    assert.ok(fs.existsSync(path.join(meta.tweakDir, 'marker.txt')), 'tweakcc dir should remain when noTweak');
  } finally {
    cleanup(rootDir);
    cleanup(binDir);
  }
});
