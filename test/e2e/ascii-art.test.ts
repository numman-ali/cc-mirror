/**
 * E2E Tests - Colored ASCII Art Verification
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import * as core from '../../src/core/index.js';
import { getWrapperPath, getWrapperScriptPath } from '../../src/core/paths.js';
import { makeTempDir, readFile, cleanup } from '../helpers/index.js';
import { PROVIDERS } from './providers.js';

const isWindows = process.platform === 'win32';

test('E2E: Colored ASCII art content verification', async (t) => {
  const createdDirs: string[] = [];

  t.after(() => {
    for (const dir of createdDirs) {
      cleanup(dir);
    }
  });

  await t.test('each provider has distinct color scheme in wrapper', () => {
    const rootDir = makeTempDir();
    const binDir = makeTempDir();
    createdDirs.push(rootDir, binDir);

    // Create all providers
    const wrapperContents: Map<string, string> = new Map();

    for (const provider of PROVIDERS) {
      core.createVariant({
        name: `color-${provider.key}`,
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

      const wrapperPath = getWrapperPath(binDir, `color-${provider.key}`);
      const scriptPath = getWrapperScriptPath(binDir, `color-${provider.key}`);
      wrapperContents.set(provider.key, readFile(isWindows ? scriptPath : wrapperPath));
    }

    // Verify each provider has its specific color
    /* eslint-disable no-control-regex */
    const colorPatterns: Record<string, RegExp> = isWindows
      ? {
          zai: /\\u001b\[38;5;220m/, // Gold
          minimax: /\\u001b\[38;5;203m/, // Coral/salmon red
          openrouter: /\\u001b\[38;5;43m/, // Teal
          ccrouter: /\\u001b\[38;5;39m/, // Sky blue
        }
      : {
          zai: /\x1b\[38;5;220m/, // Gold
          minimax: /\x1b\[38;5;203m/, // Coral/salmon red
          openrouter: /\x1b\[38;5;43m/, // Teal
          ccrouter: /\x1b\[38;5;39m/, // Sky blue
        };
    /* eslint-enable no-control-regex */

    for (const [providerKey, pattern] of Object.entries(colorPatterns)) {
      const content = wrapperContents.get(providerKey);
      assert.ok(content, `Should have content for ${providerKey}`);
      assert.ok(pattern.test(content), `${providerKey} should have its specific primary color`);
    }

    // Verify ASCII art text content - check for taglines and block patterns
    const asciiPatterns: Record<string, string[]> = {
      zai: ['███████╗', 'GLM Coding Plan'],
      minimax: ['███╗   ███╗', 'MiniMax-M2.1', 'AGI for All'],
      openrouter: ['██████╗ ██████╗', 'One API', 'Any Model'],
      ccrouter: ['██████╗ ██████╗██████╗', 'Claude Code Router', 'Any Model'],
    };

    for (const [providerKey, patterns] of Object.entries(asciiPatterns)) {
      const content = wrapperContents.get(providerKey);
      assert.ok(content, `Should have content for ${providerKey}`);
      for (const pattern of patterns) {
        assert.ok(content.includes(pattern), `${providerKey} should include "${pattern}" in ASCII art`);
      }
    }
  });
});
