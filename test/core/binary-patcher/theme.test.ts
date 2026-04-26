import test from 'node:test';
import assert from 'node:assert/strict';

import { ThemeAnchorNotFound, applyTheme } from '../../../src/core/binary-patcher/theme.js';
import type { Theme } from '../../../src/brands/types.js';

const themes: Theme[] = [
  {
    id: 'dark',
    name: 'Dark mode',
    colors: { bashBorder: '#fff', autoAccept: '#0f0', text: '#aaa' },
  },
  {
    id: 'zai-gold',
    name: 'Z.ai gold',
    colors: { bashBorder: '#daa', autoAccept: '#fda', text: '#bbb' },
  },
];

// Modeled after CC >=2.1.83 minified output. Order in the file must match the
// patcher's empirical assumption: obj < objArr < switch.
const NEW_FORMAT_FIXTURE = [
  'function getNames(){return{"dark":"Dark mode","light":"Light mode","zaiGold":"Auto Z.ai gold"}}',
  'const themeOptions=[{label:"Dark mode",value:"dark"},{label:"Light mode",value:"light"}];',
  'function pickTheme(A){switch(A){case"light":return LX9;case"dark":return CX9;default:return CX9}}',
].join('\n');

const OLD_FORMAT_FIXTURE = [
  'function getNames(){return{"dark":"Dark mode","light":"Light mode"}}',
  'const themeOptions=[{label:"Dark mode",value:"dark"},{label:"Light mode",value:"light"}];',
  'function pickTheme(A){switch(A){case"dark":return{"autoAccept":"#0f0","bashBorder":"#fff","text":"#aaa"};default:return{"autoAccept":"#0f0","bashBorder":"#fff","text":"#aaa"}}}',
].join('\n');

test('applyTheme rewrites obj, objArr, and switch on new-format CC bundle', () => {
  const result = applyTheme(NEW_FORMAT_FIXTURE, themes);
  assert.equal(result.replaced, 3);
  assert.match(result.js, /case"dark":return\{"bashBorder":"#fff"/);
  assert.match(result.js, /case"zai-gold":return\{"bashBorder":"#daa"/);
  assert.match(result.js, /default:return\{"bashBorder":"#fff"/);
  assert.match(result.js, /\[\{"label":"Dark mode","value":"dark"\},\{"label":"Z\.ai gold","value":"zai-gold"\}\]/);
  assert.match(result.js, /return\{"dark":"Dark mode","zai-gold":"Z\.ai gold"\}/);
});

test('applyTheme rewrites old-format CC bundle (inline objects)', () => {
  const result = applyTheme(OLD_FORMAT_FIXTURE, themes);
  assert.equal(result.replaced, 3);
  assert.match(result.js, /case"zai-gold":return\{"bashBorder":"#daa"/);
});

test('applyTheme is a no-op when themes list is empty', () => {
  const result = applyTheme(NEW_FORMAT_FIXTURE, []);
  assert.equal(result.replaced, 0);
  assert.equal(result.js, NEW_FORMAT_FIXTURE);
});

test('applyTheme throws ThemeAnchorNotFound when switch anchor is missing', () => {
  const broken = NEW_FORMAT_FIXTURE.replace(/switch\(A\)\{[^}]*\}\}/, '/* removed */');
  assert.throws(
    () => applyTheme(broken, themes),
    (err: unknown) => err instanceof ThemeAnchorNotFound && err.anchor === 'switch'
  );
});

test('applyTheme throws ThemeAnchorNotFound when objArr anchor is missing', () => {
  const broken = NEW_FORMAT_FIXTURE.replace(/const themeOptions=\[[^;]+\];/, '/* removed */');
  assert.throws(
    () => applyTheme(broken, themes),
    (err: unknown) => err instanceof ThemeAnchorNotFound && err.anchor === 'objArr'
  );
});

test('applyTheme throws ThemeAnchorNotFound when obj anchor is missing', () => {
  const broken = NEW_FORMAT_FIXTURE.replace(/function getNames[^}]+\}\}/, '/* removed */');
  assert.throws(
    () => applyTheme(broken, themes),
    (err: unknown) => err instanceof ThemeAnchorNotFound && err.anchor === 'obj'
  );
});
