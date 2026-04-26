import test from 'node:test';
import assert from 'node:assert/strict';

import { OVERLAY_MARKERS, applyPrompts } from '../../../src/core/binary-patcher/prompts.js';

const WEBFETCH_TAIL =
  '- For GitHub URLs, prefer using the gh CLI via Bash instead (e.g., gh pr view, gh issue view, gh api).';

// Synthesise a minimal cli.js where each prompt sits in a template literal,
// matching how Bun-compiled Claude Code wraps interpolated prompts.
const buildFixture = (): string => {
  const webfetchPrompt = `let WEBFETCH=\`Fetches and processes URLs.

  - HTTP URLs are upgraded to HTTPS
  - When the prompt mentions a host name, prefer using the canonical name
  - Returns may be summarized for very large content
  - When a URL redirects to a different host, the tool will inform you and provide the redirect URL in a special format. You should then make a new WebFetch request with the redirect URL to fetch the content.
  - For GitHub URLs, prefer using the gh CLI via Bash instead (e.g., gh pr view, gh issue view, gh api).\`;`;

  const skillPrompt = `function getSkill(){return \`Execute a skill.

If you see a <\${TAG}> tag in the current conversation turn, the skill has ALREADY been loaded - follow the instructions directly instead of calling this tool again\`}`;

  return [webfetchPrompt, skillPrompt].join('\n\n');
};

test('applyPrompts splices an overlay after the webfetch tail anchor', () => {
  const fixture = buildFixture();
  const result = applyPrompts(fixture, { webfetch: 'Use zai-cli read instead.' });

  assert.deepEqual(result.replacedTargets, ['webfetch']);
  assert.deepEqual(result.missing, []);
  assert.ok(result.js.includes(WEBFETCH_TAIL));
  assert.ok(result.js.includes(OVERLAY_MARKERS.start));
  assert.ok(result.js.includes('Use zai-cli read instead.'));
  assert.ok(result.js.includes(OVERLAY_MARKERS.end));

  const startIdx = result.js.indexOf(OVERLAY_MARKERS.start);
  const tailIdx = result.js.indexOf(WEBFETCH_TAIL);
  assert.ok(startIdx > tailIdx, 'overlay block should sit after the tail anchor');
});

test('applyPrompts is idempotent: re-applying replaces the existing block instead of duplicating', () => {
  const fixture = buildFixture();
  const first = applyPrompts(fixture, { webfetch: 'first overlay text' });
  const second = applyPrompts(first.js, { webfetch: 'second overlay text' });

  const startCount = (second.js.match(/cc-mirror:provider-overlay start/g) ?? []).length;
  const endCount = (second.js.match(/cc-mirror:provider-overlay end/g) ?? []).length;
  assert.equal(startCount, 1, 'should not duplicate start markers');
  assert.equal(endCount, 1, 'should not duplicate end markers');
  assert.ok(second.js.includes('second overlay text'));
  assert.ok(!second.js.includes('first overlay text'), 'old overlay text should be replaced');
});

test('applyPrompts handles multiple overlay keys in one call', () => {
  const fixture = buildFixture();
  const result = applyPrompts(fixture, {
    webfetch: 'web overlay',
    skill: 'skill overlay',
  });
  assert.deepEqual(result.replacedTargets.sort(), ['skill', 'webfetch']);
  assert.ok(result.js.includes('web overlay'));
  assert.ok(result.js.includes('skill overlay'));
});

test('applyPrompts records keys whose anchor is missing without throwing', () => {
  const trimmed = buildFixture().replace(WEBFETCH_TAIL, '');
  const result = applyPrompts(trimmed, { webfetch: 'will not splice' });
  assert.deepEqual(result.replacedTargets, []);
  assert.deepEqual(result.missing, ['webfetch']);
  assert.ok(!result.js.includes('will not splice'));
});

test('applyPrompts records unknown OverlayKeys as missing', () => {
  const fixture = buildFixture();
  // 'main' is a known OverlayKey but currently has no anchor in cc-mirror.
  const result = applyPrompts(fixture, { main: 'overlay text' });
  assert.deepEqual(result.replacedTargets, []);
  assert.deepEqual(result.missing, ['main']);
});

test('applyPrompts skips empty or whitespace-only overlay text', () => {
  const fixture = buildFixture();
  const result = applyPrompts(fixture, { webfetch: '   \n  \t\n' });
  assert.deepEqual(result.replacedTargets, []);
  assert.deepEqual(result.missing, []);
  assert.equal(result.js, fixture);
});

test('applyPrompts escapes backticks and ${ in overlay text for template-literal prompts', () => {
  const fixture = buildFixture();
  const dangerous = 'Use `npx zai-cli` to ${run} commands';
  const result = applyPrompts(fixture, { webfetch: dangerous });
  assert.deepEqual(result.replacedTargets, ['webfetch']);
  assert.ok(result.js.includes('Use \\`npx zai-cli\\` to \\${run} commands'));
  assert.ok(!result.js.includes('Use `npx zai-cli`'), 'raw backticks must not remain inside the template literal');
});

test('applyPrompts leaves the JS untouched when overlays object is empty', () => {
  const fixture = buildFixture();
  const result = applyPrompts(fixture, {});
  assert.deepEqual(result.replacedTargets, []);
  assert.deepEqual(result.missing, []);
  assert.equal(result.js, fixture);
});
