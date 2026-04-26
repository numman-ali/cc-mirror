import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  UnpackedManifestError,
  patchUnpackedEntry,
  resolveEntryPath,
} from '../../../src/core/binary-patcher/js-patch.js';
import { OVERLAY_MARKERS } from '../../../src/core/binary-patcher/prompts.js';
import { ThemeAnchorNotFound } from '../../../src/core/binary-patcher/theme.js';
import type { TweakccConfig } from '../../../src/brands/types.js';
import type { OverlayMap } from '../../../src/core/prompt-pack/types.js';

const themes: TweakccConfig['settings']['themes'] = [
  { id: 'dark', name: 'Dark mode', colors: { bashBorder: '#fff', autoAccept: '#0f0', text: '#aaa' } },
  { id: 'zai-gold', name: 'Z.ai gold', colors: { bashBorder: '#daa', autoAccept: '#fda', text: '#bbb' } },
];

const config: TweakccConfig = {
  ccVersion: '2.1.119',
  ccInstallationPath: null,
  lastModified: '2026-04-26T00:00:00Z',
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
};

const ENTRY_BODY = [
  'function getNames(){return{"dark":"Dark mode","light":"Light mode"}}',
  'const themeOptions=[{label:"Dark mode",value:"dark"},{label:"Light mode",value:"light"}];',
  'function pickTheme(A){switch(A){case"light":return LX9;case"dark":return CX9;default:return CX9}}',
  'const explorePrompt=`...lots of text...',
  "Complete the user's search request efficiently and report your findings clearly.`",
].join('\n');

const wrapBunCjs = (body: string): string =>
  `// @bun @bytecode @bun-cjs\n(function(exports, require, module, __filename, __dirname) {${body}})`;

const setupUnpacked = (entryBody: string, opts: { wrap?: boolean } = {}): string => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-jspatch-'));
  fs.mkdirSync(path.join(dir, 'src', 'entrypoints'), { recursive: true });
  const entryRel = 'src/entrypoints/cli.js';
  const entryAbs = path.join(dir, entryRel);
  fs.writeFileSync(entryAbs, opts.wrap === false ? entryBody : wrapBunCjs(entryBody), 'latin1');
  fs.writeFileSync(
    path.join(dir, 'manifest.json'),
    JSON.stringify({ entryPoint: entryRel, entryPointId: 0, modules: [{ name: entryRel, isEntry: true }] }),
    'utf8'
  );
  return dir;
};

test('patchUnpackedEntry strips wrapper, applies theme, and writes back', () => {
  const dir = setupUnpacked(ENTRY_BODY);

  const result = patchUnpackedEntry({ unpackedDir: dir, config, overlays: null });

  assert.equal(result.themeReplaced, 3);
  const written = fs.readFileSync(result.entryPath, 'latin1');
  assert.ok(!written.startsWith('// @bun'), 'leading bun annotation should be gone');
  assert.ok(!written.startsWith('(function('), 'wrapper open should be stripped');
  assert.match(written, /case"zai-gold":return\{"bashBorder":"#daa"/);
});

test('patchUnpackedEntry applies prompt overlays via tail anchor', () => {
  const dir = setupUnpacked(ENTRY_BODY);
  const overlays: OverlayMap = { explore: 'Z.ai routing rule: prefer search via zai-cli.' };

  const result = patchUnpackedEntry({ unpackedDir: dir, config, overlays });

  assert.deepEqual(result.promptReplaced, ['explore']);
  const written = fs.readFileSync(result.entryPath, 'latin1');
  assert.ok(written.includes(OVERLAY_MARKERS.start), 'overlay start marker should be present');
  assert.ok(written.includes('Z.ai routing rule'), 'overlay text should be inserted');
});

test('patchUnpackedEntry replaces an existing overlay block instead of duplicating', () => {
  // Pre-seed the entry with an existing overlay block right after the explore
  // tail anchor. patchUnpackedEntry should replace it, not append a second one.
  const tail = "Complete the user's search request efficiently and report your findings clearly.";
  const seeded = ENTRY_BODY.replace(tail, `${tail}\n\n${OVERLAY_MARKERS.start}\nOverlay v1\n${OVERLAY_MARKERS.end}\n`);
  const dir = setupUnpacked(seeded);

  const result = patchUnpackedEntry({ unpackedDir: dir, config, overlays: { explore: 'Overlay v2' } });

  assert.deepEqual(result.promptReplaced, ['explore']);
  const written = fs.readFileSync(result.entryPath, 'latin1');
  const startCount = written.split(OVERLAY_MARKERS.start).length - 1;
  assert.equal(startCount, 1, 'should have exactly one overlay block');
  assert.ok(written.includes('Overlay v2'));
  assert.ok(!written.includes('Overlay v1'));
});

test('patchUnpackedEntry throws ThemeAnchorNotFound on broken theme anchors', () => {
  const broken = ENTRY_BODY.replace(/switch\(A\)\{[^}]*\}/, '/* removed */');
  const dir = setupUnpacked(broken);

  assert.throws(
    () => patchUnpackedEntry({ unpackedDir: dir, config, overlays: null }),
    (err: unknown) => err instanceof ThemeAnchorNotFound
  );
});

test('resolveEntryPath throws when manifest is missing', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-jspatch-no-mf-'));
  assert.throws(
    () => resolveEntryPath(dir),
    (err: unknown) => err instanceof UnpackedManifestError
  );
});
