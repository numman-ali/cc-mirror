/**
 * Diff colors for brand themes.
 *
 * Returns the Claude Code default dark-mode diff palette — battle-tested by
 * Anthropic for readability across terminals. Brand identity comes from the
 * other ~55 theme properties; diffs should just be functional.
 */

export interface DiffPaletteInput {
  /** Kept for API compat — ignored. */
  base?: string;
  added?: string;
  removed?: string;
  tint?: string;
}

export interface DiffColors {
  diffAdded: string;
  diffRemoved: string;
  diffAddedDimmed: string;
  diffRemovedDimmed: string;
  diffAddedWord: string;
  diffRemovedWord: string;
  diffAddedWordDimmed: string;
  diffRemovedWordDimmed: string;
}

/** Claude Code default dark-mode diff colors. */
const DARK_DEFAULTS: DiffColors = {
  diffAdded: 'rgb(34,92,43)',
  diffRemoved: 'rgb(122,41,54)',
  diffAddedDimmed: 'rgb(71,88,74)',
  diffRemovedDimmed: 'rgb(105,72,77)',
  diffAddedWord: 'rgb(56,166,96)',
  diffRemovedWord: 'rgb(179,89,107)',
  diffAddedWordDimmed: 'rgb(46,107,58)',
  diffRemovedWordDimmed: 'rgb(139,57,69)',
};

export function buildDiffPalette(_input?: DiffPaletteInput): DiffColors {
  return DARK_DEFAULTS;
}
