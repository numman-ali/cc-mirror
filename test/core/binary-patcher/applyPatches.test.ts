import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { applyPatches } from '../../../src/core/binary-patcher/index.js';
import { parseBunBinary } from '../../../src/core/bun-extract.js';
import { OVERLAY_MARKERS } from '../../../src/core/binary-patcher/prompts.js';
import { buildBunFixture } from '../../helpers/bun-fixture.js';
import type { TweakccConfig, Theme } from '../../../src/brands/types.js';

const themes: Theme[] = [
  { id: 'dark', name: 'Dark mode', colors: { bashBorder: '#fff' } },
  { id: 'zai-gold', name: 'Z.ai gold', colors: { bashBorder: '#daa' } },
];

const buildEntryJs = (): string =>
  [
    // Theme fixtures: obj < objArr < switch ordering matches the patcher's empirical assumption.
    'function getNames(){return{"dark":"Dark mode","light":"Light mode"}}',
    'const themeOptions=[{label:"Dark mode",value:"dark"},{label:"Light mode",value:"light"}];',
    'function pickTheme(A){switch(A){case"light":return LX9;case"dark":return CX9;default:return CX9}}',
    // Prompt fixture (template literal, with a tail anchor we have a spec for).
    'let WEBFETCH=`Fetches and processes URLs.\n\n  - For GitHub URLs, prefer using the gh CLI via Bash instead (e.g., gh pr view, gh issue view, gh api).`;',
  ].join('\n');

const buildConfig = (): TweakccConfig => ({
  ccVersion: '2.1.98',
  ccInstallationPath: null,
  lastModified: '2026-04-25T00:00:00Z',
  changesApplied: false,
  hidePiebaldAnnouncement: true,
  settings: {
    themes,
    thinkingVerbs: { format: '...', verbs: [] },
    thinkingStyle: { reverseMirror: false, updateInterval: 100, phases: [] },
    userMessageDisplay: {
      format: '> {}',
      styling: [],
      foregroundColor: 'default',
      backgroundColor: null,
      borderStyle: 'round',
      borderColor: 'default',
      paddingX: 1,
      paddingY: 0,
      fitBoxToContent: true,
    },
    inputBox: { removeBorder: false },
    misc: {
      showTweakccVersion: false,
      showPatchesApplied: false,
      expandThinkingBlocks: false,
      enableConversationTitle: false,
      hideStartupBanner: false,
      hideCtrlGToEdit: false,
      hideStartupClawd: false,
      increaseFileReadLimit: false,
      suppressLineNumbers: false,
      suppressRateLimitOptions: false,
      mcpConnectionNonBlocking: false,
      mcpServerBatchSize: null,
      statuslineThrottleMs: null,
      statuslineUseFixedInterval: false,
      tableFormat: 'default',
      enableSwarmMode: false,
      enableSessionMemory: false,
      enableRememberSkill: false,
      tokenCountRounding: null,
      autoAcceptPlanMode: false,
      allowBypassPermissionsInSudo: null,
      suppressNativeInstallerWarning: false,
      filterScrollEscapeSequences: false,
    },
    claudeMdAltNames: null,
  },
});

const writeFixture = (platform: 'elf' | 'macho' | 'pe', entryJs: string): string => {
  const fix = buildBunFixture({
    platform,
    moduleStructSize: 52,
    modules: [
      { name: 'src/header.js', content: 'function header(){}' },
      { name: 'src/cli.js', content: entryJs },
      { name: 'src/footer.js', content: 'function footer(){}' },
    ],
    entryPointId: 1,
  });
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-binary-patcher-'));
  const file = path.join(dir, 'claude');
  fs.writeFileSync(file, fix.buf);
  return file;
};

const readEntryJs = (binaryPath: string): string => {
  const buf = fs.readFileSync(binaryPath);
  const info = parseBunBinary(buf);
  const entry = info.modules[info.entryPointId];
  return buf.subarray(info.dataStart + entry.contOff, info.dataStart + entry.contOff + entry.contLen).toString('utf8');
};

for (const platform of ['elf', 'macho', 'pe'] as const) {
  test(`applyPatches end-to-end on ${platform}: theme + prompts both applied`, async () => {
    const binaryPath = writeFixture(platform, buildEntryJs());
    const result = await applyPatches({
      binaryPath,
      config: buildConfig(),
      overlays: { webfetch: 'Use zai-cli read instead.' },
    });

    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.deepEqual(result.missingPromptKeys, []);
    // resigned only on macOS-with-codesign and only when LC_CODE_SIGNATURE was stripped;
    // our fixture has no signature, so resigned should be false on every platform.
    assert.equal(result.resigned, false);

    const newJs = readEntryJs(binaryPath);
    assert.match(newJs, /case"zai-gold":return\{"bashBorder":"#daa"\}/);
    assert.match(newJs, /\{"label":"Z\.ai gold","value":"zai-gold"\}/);
    assert.ok(newJs.includes(OVERLAY_MARKERS.start));
    assert.ok(newJs.includes('Use zai-cli read instead.'));
    assert.ok(newJs.includes(OVERLAY_MARKERS.end));

    fs.rmSync(path.dirname(binaryPath), { recursive: true, force: true });
  });

  test(`applyPatches on ${platform} returns anchor-not-found when theme switch is gone`, async () => {
    const broken = buildEntryJs().replace(/function pickTheme[^}]+\}\}/, '/* removed */');
    const binaryPath = writeFixture(platform, broken);
    const result = await applyPatches({
      binaryPath,
      config: buildConfig(),
      overlays: null,
    });
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.equal(result.reason, 'anchor-not-found');
    fs.rmSync(path.dirname(binaryPath), { recursive: true, force: true });
  });
}

test('applyPatches records prompt keys whose anchor is missing without aborting', async () => {
  const binaryPath = writeFixture('elf', buildEntryJs());
  const result = await applyPatches({
    binaryPath,
    config: buildConfig(),
    // 'main' has no anchor in cc-mirror; should be in missingPromptKeys.
    overlays: { webfetch: 'web', main: 'main' },
  });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.deepEqual(result.missingPromptKeys, ['main']);
  fs.rmSync(path.dirname(binaryPath), { recursive: true, force: true });
});

test('applyPatches returns io-error when binary path is unreadable', async () => {
  const result = await applyPatches({
    binaryPath: '/nonexistent/path/to/claude/binary',
    config: buildConfig(),
    overlays: null,
  });
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.equal(result.reason, 'io-error');
});
