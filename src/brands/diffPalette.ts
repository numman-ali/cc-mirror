/**
 * Smart diff color generator.
 *
 * Produces all 8 diff-highlight color properties with perceptually correct
 * contrast. Detects dark vs light base via relative luminance and scales
 * mix weights so diffs are always readable — no more invisible greens on
 * dark backgrounds or washed-out reds on light ones.
 */

type Rgb = { r: number; g: number; b: number };

const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));

const hexToRgb = (hex: string): Rgb => {
  const n = hex.replace('#', '').trim();
  if (n.length === 3) {
    const [r, g, b] = n.split('');
    return {
      r: clamp(parseInt(r + r, 16)),
      g: clamp(parseInt(g + g, 16)),
      b: clamp(parseInt(b + b, 16)),
    };
  }
  return {
    r: clamp(parseInt(n.slice(0, 2), 16)),
    g: clamp(parseInt(n.slice(2, 4), 16)),
    b: clamp(parseInt(n.slice(4, 6), 16)),
  };
};

const rgbStr = ({ r, g, b }: Rgb) => `rgb(${r},${g},${b})`;

const mix = (a: Rgb, b: Rgb, w: number): Rgb => ({
  r: clamp(a.r + (b.r - a.r) * w),
  g: clamp(a.g + (b.g - a.g) * w),
  b: clamp(a.b + (b.b - a.b) * w),
});

/** sRGB relative luminance (0 = black, 1 = white). */
const luminance = ({ r, g, b }: Rgb): number => {
  const lin = (c: number) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
};

export interface DiffPaletteInput {
  /** Theme background color (hex). Used to detect dark/light. */
  base: string;
  /** "Added" accent (hex) — typically green. */
  added: string;
  /** "Removed" accent (hex) — typically red. */
  removed: string;
  /** Optional brand accent (hex) to subtly tint diff colors. */
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

// Weight presets tuned against the official Claude Code dark/light themes.
//   bg     = diff line background wash
//   bgDim  = dimmed variant of the above
//   word   = word-level highlight (must be clearly legible)
//   wordDim = dimmed word highlight
const DARK_W = { bg: 0.35, bgDim: 0.2, word: 0.58, wordDim: 0.42 };
const LIGHT_W = { bg: 0.18, bgDim: 0.1, word: 0.4, wordDim: 0.26 };

export function buildDiffPalette(input: DiffPaletteInput): DiffColors {
  const base = hexToRgb(input.base);
  let added = hexToRgb(input.added);
  let removed = hexToRgb(input.removed);

  // Optional brand tinting — blend 15% of the accent into the diff accents
  // so ZAI diffs feel golden, Kimi diffs feel aurora-ish, etc.
  if (input.tint) {
    const t = hexToRgb(input.tint);
    added = mix(added, t, 0.12);
    removed = mix(removed, t, 0.12);
  }

  const lum = luminance(base);

  // Smoothly interpolate between dark and light weights.
  // Luminance 0.03 (deep dark) → full dark weights
  // Luminance 0.25 (light bg)  → full light weights
  const t = Math.max(0, Math.min(1, (lum - 0.03) / 0.22));
  const lerp = (d: number, l: number) => d + (l - d) * t;
  const w = {
    bg: lerp(DARK_W.bg, LIGHT_W.bg),
    bgDim: lerp(DARK_W.bgDim, LIGHT_W.bgDim),
    word: lerp(DARK_W.word, LIGHT_W.word),
    wordDim: lerp(DARK_W.wordDim, LIGHT_W.wordDim),
  };

  return {
    diffAdded: rgbStr(mix(base, added, w.bg)),
    diffRemoved: rgbStr(mix(base, removed, w.bg)),
    diffAddedDimmed: rgbStr(mix(base, added, w.bgDim)),
    diffRemovedDimmed: rgbStr(mix(base, removed, w.bgDim)),
    diffAddedWord: rgbStr(mix(base, added, w.word)),
    diffRemovedWord: rgbStr(mix(base, removed, w.word)),
    diffAddedWordDimmed: rgbStr(mix(base, added, w.wordDim)),
    diffRemovedWordDimmed: rgbStr(mix(base, removed, w.wordDim)),
  };
}
