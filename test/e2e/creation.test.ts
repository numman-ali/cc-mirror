/**
 * E2E Tests - Variant Creation for All Providers
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import * as core from '../../src/core/index.js';
import { makeTempDir, readFile, cleanup, withFakeNpm } from '../helpers/index.js';
import { getWrapperFilename, getPlatform } from '../../src/core/platform.js';
import { PROVIDERS } from './providers.js';

const isWindows = getPlatform() === 'win32';

test('E2E: Create variants for all providers', async (t) => {
  const createdDirs: string[] = [];

  t.after(() => {
    for (const dir of createdDirs) {
      cleanup(dir);
    }
  });

  await t.test('creates all 4 provider variants with correct configuration', () => {
    withFakeNpm(() => {
      for (const provider of PROVIDERS) {
        const rootDir = makeTempDir();
        const binDir = makeTempDir();
        createdDirs.push(rootDir, binDir);

        const result = core.createVariant({
          name: provider.key,
          providerKey: provider.key,
          apiKey: provider.apiKey,
          rootDir,
          binDir,
          brand: provider.key,
          promptPack: false,
          skillInstall: false,
          noTweak: true,
          tweakccStdio: 'pipe',
        });

        // Verify variant was created
        const variantDir = path.join(rootDir, provider.key);
        assert.ok(fs.existsSync(variantDir), `${provider.name} variant dir should exist`);

        // Verify wrapper was created
        const wrapperPath = path.join(binDir, getWrapperFilename(provider.key));
        assert.ok(fs.existsSync(wrapperPath), `${provider.name} wrapper should exist`);
        assert.equal(result.wrapperPath, wrapperPath);

        // Verify settings.json was created with correct provider config
        const configPath = path.join(variantDir, 'config', 'settings.json');
        assert.ok(fs.existsSync(configPath), `${provider.name} settings.json should exist`);
        const config = JSON.parse(readFile(configPath)) as { env: Record<string, string> };
        assert.ok(config.env, `${provider.name} should have env section`);

        // Verify tweakcc config has correct theme
        const tweakConfigPath = path.join(variantDir, 'tweakcc', 'config.json');
        assert.ok(fs.existsSync(tweakConfigPath), `${provider.name} tweakcc config should exist`);
        const tweakConfig = JSON.parse(readFile(tweakConfigPath)) as {
          settings?: { themes?: { id?: string }[] };
        };
        assert.equal(
          tweakConfig.settings?.themes?.[0]?.id,
          provider.expectedThemeId,
          `${provider.name} should have correct theme ID`
        );
      }
    });
  });

  await t.test('wrapper scripts contain colored ASCII art', () => {
    withFakeNpm(() => {
      for (const provider of PROVIDERS) {
        const rootDir = makeTempDir();
        const binDir = makeTempDir();
        createdDirs.push(rootDir, binDir);

        core.createVariant({
          name: `${provider.key}-art`,
          providerKey: provider.key,
          apiKey: provider.apiKey,
          rootDir,
          binDir,
          brand: provider.key,
          promptPack: false,
          skillInstall: false,
          noTweak: true,
          tweakccStdio: 'pipe',
        });

        const wrapperPath = path.join(binDir, getWrapperFilename(`${provider.key}-art`));
        const wrapperContent = readFile(wrapperPath);

        // Verify ANSI color codes are present (escape character \x1b)
        assert.ok(wrapperContent.includes('\x1b[38;5;'), `${provider.name} wrapper should contain ANSI color codes`);

        const splashPattern = isWindows ? `"${provider.expectedSplashStyle}"` : `${provider.expectedSplashStyle})`;
        assert.ok(wrapperContent.includes(splashPattern), `${provider.name} wrapper should have case for splash style`);

        // Verify reset code is present
        assert.ok(wrapperContent.includes('\x1b[0m'), `${provider.name} wrapper should contain color reset code`);

        // Verify CC_MIRROR_SPLASH_STYLE env var is read
        assert.ok(
          wrapperContent.includes('CC_MIRROR_SPLASH_STYLE'),
          `${provider.name} wrapper should reference CC_MIRROR_SPLASH_STYLE`
        );
      }
    });
  });

  await t.test('variant.json metadata is created correctly', () => {
    withFakeNpm(() => {
      for (const provider of PROVIDERS) {
        const rootDir = makeTempDir();
        const binDir = makeTempDir();
        createdDirs.push(rootDir, binDir);

        core.createVariant({
          name: `${provider.key}-meta`,
          providerKey: provider.key,
          apiKey: provider.apiKey,
          rootDir,
          binDir,
          brand: provider.key,
          promptPack: false,
          skillInstall: false,
          noTweak: true,
          tweakccStdio: 'pipe',
        });

        const variantMetaPath = path.join(rootDir, `${provider.key}-meta`, 'variant.json');
        assert.ok(fs.existsSync(variantMetaPath), `${provider.name} variant.json should exist`);

        const meta = JSON.parse(readFile(variantMetaPath)) as {
          name: string;
          provider: string;
          createdAt: string;
        };
        assert.equal(meta.name, `${provider.key}-meta`);
        assert.equal(meta.provider, provider.key);
        assert.ok(meta.createdAt, 'createdAt should be set');
      }
    });
  });
});
