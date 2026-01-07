import { describe, it } from 'node:test';
import assert from 'node:assert';
import { ANSI, SPLASH_CONFIGS, DEFAULT_SPLASH, getSplashConfig } from '../../src/core/splash.js';

describe('ANSI color codes', () => {
  it('exports reset code', () => {
    assert.strictEqual(ANSI.reset, '\x1b[0m');
  });

  it('exports color codes for all providers', () => {
    assert.ok(ANSI.zaiPrimary.startsWith('\x1b[38;5;'));
    assert.ok(ANSI.mmPrimary.startsWith('\x1b[38;5;'));
    assert.ok(ANSI.orPrimary.startsWith('\x1b[38;5;'));
    assert.ok(ANSI.ccrPrimary.startsWith('\x1b[38;5;'));
    assert.ok(ANSI.mirPrimary.startsWith('\x1b[38;5;'));
    assert.ok(ANSI.defPrimary.startsWith('\x1b[38;5;'));
  });
});

describe('SPLASH_CONFIGS', () => {
  it('contains configurations for all expected providers', () => {
    const keys = SPLASH_CONFIGS.map((c) => c.key);
    assert.ok(keys.includes('zai'));
    assert.ok(keys.includes('minimax'));
    assert.ok(keys.includes('openrouter'));
    assert.ok(keys.includes('ccrouter'));
    assert.ok(keys.includes('mirror'));
  });

  it('each config has required fields', () => {
    for (const config of SPLASH_CONFIGS) {
      assert.ok(typeof config.key === 'string' && config.key.length > 0, `key missing for config`);
      assert.ok(Array.isArray(config.art) && config.art.length > 0, `art missing for ${config.key}`);
      assert.ok(typeof config.tagline === 'string', `tagline missing for ${config.key}`);
      assert.ok(typeof config.showLabel === 'boolean', `showLabel missing for ${config.key}`);
    }
  });

  it('each config art contains ANSI reset codes', () => {
    for (const config of SPLASH_CONFIGS) {
      const joined = config.art.join('');
      assert.ok(joined.includes(ANSI.reset), `${config.key} art should include reset codes`);
    }
  });
});

describe('DEFAULT_SPLASH', () => {
  it('has key "default"', () => {
    assert.strictEqual(DEFAULT_SPLASH.key, 'default');
  });

  it('has showLabel true', () => {
    assert.strictEqual(DEFAULT_SPLASH.showLabel, true);
  });

  it('has non-empty art array', () => {
    assert.ok(Array.isArray(DEFAULT_SPLASH.art));
    assert.ok(DEFAULT_SPLASH.art.length > 0);
  });
});

describe('getSplashConfig', () => {
  it('returns matching config for known keys', () => {
    const zai = getSplashConfig('zai');
    assert.strictEqual(zai.key, 'zai');

    const minimax = getSplashConfig('minimax');
    assert.strictEqual(minimax.key, 'minimax');

    const openrouter = getSplashConfig('openrouter');
    assert.strictEqual(openrouter.key, 'openrouter');
  });

  it('returns DEFAULT_SPLASH for unknown keys', () => {
    const unknown = getSplashConfig('unknown-provider');
    assert.strictEqual(unknown.key, 'default');
    assert.strictEqual(unknown, DEFAULT_SPLASH);
  });

  it('returns DEFAULT_SPLASH for empty string', () => {
    const empty = getSplashConfig('');
    assert.strictEqual(empty.key, 'default');
  });
});
