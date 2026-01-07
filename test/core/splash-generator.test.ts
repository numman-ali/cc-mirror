import { describe, it } from 'node:test';
import assert from 'node:assert';
import { generateBashSplash, generateWindowsSplash } from '../../src/core/splash.js';

describe('generateBashSplash', () => {
  it('returns array of bash script lines', () => {
    const lines = generateBashSplash();
    assert.ok(Array.isArray(lines));
    assert.ok(lines.length > 0);
  });

  it('includes CC_MIRROR_SPLASH environment check', () => {
    const lines = generateBashSplash();
    const joined = lines.join('\n');
    assert.ok(joined.includes('CC_MIRROR_SPLASH'));
  });

  it('includes case statement for splash styles', () => {
    const lines = generateBashSplash();
    const joined = lines.join('\n');
    assert.ok(joined.includes('case "$__cc_style" in'));
    assert.ok(joined.includes('zai)'));
    assert.ok(joined.includes('minimax)'));
    assert.ok(joined.includes('openrouter)'));
    assert.ok(joined.includes('ccrouter)'));
    assert.ok(joined.includes('mirror)'));
    assert.ok(joined.includes('esac'));
  });

  it('includes TTY check', () => {
    const lines = generateBashSplash();
    const joined = lines.join('\n');
    assert.ok(joined.includes('-t 1'));
  });

  it('includes heredoc markers for each style', () => {
    const lines = generateBashSplash();
    const joined = lines.join('\n');
    assert.ok(joined.includes("cat <<'CCMZAI'"));
    assert.ok(joined.includes('CCMZAI'));
    assert.ok(joined.includes("cat <<'CCMMIN'"));
    assert.ok(joined.includes('CCMMIN'));
  });
});

describe('generateWindowsSplash', () => {
  it('returns array of batch script lines', () => {
    const lines = generateWindowsSplash();
    assert.ok(Array.isArray(lines));
    assert.ok(lines.length > 0);
  });

  it('includes CC_MIRROR_SPLASH environment check', () => {
    const lines = generateWindowsSplash();
    const joined = lines.join('\r\n');
    assert.ok(joined.includes('CC_MIRROR_SPLASH'));
  });

  it('includes if statements for splash styles', () => {
    const lines = generateWindowsSplash();
    const joined = lines.join('\r\n');
    assert.ok(joined.includes('CC_MIRROR_SPLASH_STYLE'));
  });

  it('includes echo statements for ASCII art', () => {
    const lines = generateWindowsSplash();
    const joined = lines.join('\r\n');
    assert.ok(joined.includes('echo'));
  });

  it('uses proper batch escaping for special characters', () => {
    const lines = generateWindowsSplash();
    const joined = lines.join('\r\n');
    assert.ok(!joined.includes('echo |'), 'pipe should be escaped');
    assert.ok(!joined.includes('echo <'), 'less-than should be escaped');
    assert.ok(!joined.includes('echo >'), 'greater-than should be escaped');
  });
});
