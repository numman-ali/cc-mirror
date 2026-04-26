/**
 * Theme color patcher for the bundled Claude Code cli.js.
 *
 * Adapted from tweakcc 303b756 src/patches/themes.ts (MIT, Piebald LLC).
 * Three regex anchors locate (a) the theme switch statement, (b) the theme
 * options array, and (c) the theme-name mapping object. We rewrite all three
 * with our brand themes so the bundled JS knows about them.
 *
 * Returns a structured failure if any anchor is missing - the caller (Phase 1
 * rollback) restores the pristine binary in that case.
 *
 * Not idempotent: the objArr/switch regexes only match upstream's pristine
 * shape (e.g., labels starting with Dark/Light/Auto/Monochrome). cc-mirror
 * always patches from a cached pristine binary, so this is fine.
 */

import type { Theme } from '../../brands/types.js';

export class ThemeAnchorNotFound extends Error {
  constructor(public readonly anchor: 'switch' | 'objArr' | 'obj') {
    super(`theme: failed to find ${anchor} anchor in cli.js`);
    this.name = 'ThemeAnchorNotFound';
  }
}

interface LocationResult {
  startIndex: number;
  endIndex: number;
  identifiers?: string[];
}

interface ThemeLocations {
  switchStatement: LocationResult;
  objArr: LocationResult;
  obj: LocationResult;
}

const findThemeLocations = (oldFile: string): ThemeLocations | { missing: 'switch' | 'objArr' | 'obj' } => {
  // Switch statement: CC >=2.1.83 emits `switch(A){case"light":return LX9;...default:return CX9}`,
  // older CC inlines the objects directly.
  let switchStart = -1;
  let switchEnd = -1;
  let switchIdent = '';

  const newSwitchPat = /switch\(([$\w]+)\)\{case"(?:light|dark)":[^}]*return [$\w]+;[^}]*default:return [$\w]+\}/;
  const newSwitchMatch = oldFile.match(newSwitchPat);

  if (newSwitchMatch && newSwitchMatch.index !== undefined) {
    switchStart = newSwitchMatch.index;
    switchEnd = switchStart + newSwitchMatch[0].length;
    switchIdent = newSwitchMatch[1];
  } else {
    const darkAnchor = oldFile.indexOf('case"dark":return{');
    const lightAnchor = oldFile.indexOf('case"light":return{');
    const anchor = darkAnchor !== -1 ? darkAnchor : lightAnchor;
    if (anchor === -1) return { missing: 'switch' };

    const before = oldFile.slice(Math.max(0, anchor - 200), anchor);
    const switchOpen = before.match(/switch\(([$\w]+)\)\{\s*$/);
    if (!switchOpen || switchOpen.index === undefined) return { missing: 'switch' };

    switchStart = Math.max(0, anchor - 200) + switchOpen.index;
    switchIdent = switchOpen[1];
    let depth = 0;
    for (let i = switchStart; i < oldFile.length && i < switchStart + 50000; i += 1) {
      if (oldFile[i] === '{') depth += 1;
      if (oldFile[i] === '}') {
        depth -= 1;
        if (depth === 0) {
          switchEnd = i + 1;
          break;
        }
      }
    }
  }

  if (switchStart === -1 || switchEnd === -1) return { missing: 'switch' };

  // Theme options array: [{label:"Dark...",value:"..."},...] — quotes optional.
  const objArrPat = /\[(?:\.\.\.\[\],)?(?:\{"?label"?:"(?:Dark|Light|Auto|Monochrome)[^"]*","?value"?:"[^"]+"\},?)+\]/;
  const objArrMatch = oldFile.match(objArrPat);
  if (!objArrMatch || objArrMatch.index === undefined) return { missing: 'objArr' };

  // Theme-name mapping: {dark:"Dark mode",...}
  const objPat = /(?:return|[$\w]+=)\{(?:"?(?:[$\w-]+)"?:"(?:Auto |Dark|Light|Monochrome)[^"]*",?)+\}/;
  const objMatch = oldFile.match(objPat);
  if (!objMatch || objMatch.index === undefined) return { missing: 'obj' };

  return {
    switchStatement: { startIndex: switchStart, endIndex: switchEnd, identifiers: [switchIdent] },
    objArr: { startIndex: objArrMatch.index, endIndex: objArrMatch.index + objArrMatch[0].length },
    obj: { startIndex: objMatch.index, endIndex: objMatch.index + objMatch[0].length },
  };
};

export interface ApplyThemeResult {
  js: string;
  replaced: number;
}

export const applyTheme = (oldFile: string, themes: Theme[]): ApplyThemeResult => {
  if (themes.length === 0) return { js: oldFile, replaced: 0 };

  const located = findThemeLocations(oldFile);
  if ('missing' in located) {
    throw new ThemeAnchorNotFound(located.missing);
  }
  const locations = located;
  let newFile = oldFile;

  // Rewrite from highest startIndex to lowest so earlier slice positions stay valid.
  // The three anchors don't overlap, so doing them in any order is correct as long
  // as each rewrite uses the most recent newFile and slices off its OWN matched
  // span. We follow upstream's order (obj → objArr → switch) and re-resolve nothing
  // because the prior rewrite is to a region that comes BEFORE the next anchor.
  // (We rely on tweakcc's empirical observation that obj < objArr < switch in CC's
  // bundled output.)

  const objText = 'return' + JSON.stringify(Object.fromEntries(themes.map((t) => [t.id, t.name])));
  newFile = newFile.slice(0, locations.obj.startIndex) + objText + newFile.slice(locations.obj.endIndex);

  const objArrText = JSON.stringify(themes.map((t) => ({ label: t.name, value: t.id })));
  // Adjust objArr offsets for the obj rewrite delta if obj came first in the file.
  const objDelta = objText.length - (locations.obj.endIndex - locations.obj.startIndex);
  const objArrStart =
    locations.objArr.startIndex >= locations.obj.endIndex
      ? locations.objArr.startIndex + objDelta
      : locations.objArr.startIndex;
  const objArrEnd = objArrStart + (locations.objArr.endIndex - locations.objArr.startIndex);
  newFile = newFile.slice(0, objArrStart) + objArrText + newFile.slice(objArrEnd);

  const ident = locations.switchStatement.identifiers?.[0] ?? 'A';
  const switchLines: string[] = [`switch(${ident}){`];
  themes.forEach((theme) => {
    switchLines.push(`case"${theme.id}":return${JSON.stringify(theme.colors)};`);
  });
  switchLines.push(`default:return${JSON.stringify(themes[0].colors)};`);
  switchLines.push('}');
  const switchText = switchLines.join('\n');

  const objArrDelta = objArrText.length - (locations.objArr.endIndex - locations.objArr.startIndex);
  let switchStart = locations.switchStatement.startIndex;
  if (switchStart >= locations.obj.endIndex) switchStart += objDelta;
  if (switchStart >= locations.objArr.endIndex) switchStart += objArrDelta;
  const switchEnd = switchStart + (locations.switchStatement.endIndex - locations.switchStatement.startIndex);
  newFile = newFile.slice(0, switchStart) + switchText + newFile.slice(switchEnd);

  return { js: newFile, replaced: 3 };
};
