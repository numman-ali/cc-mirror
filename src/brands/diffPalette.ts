/**
 * Diff color generator tuned for Claude Code readability.
 *
 * Uses Claude-like dark/light baseline diff colors for consistent contrast
 * across tool diffs, then applies only a subtle optional brand tint.
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

const DARK_BASELINE: DiffColors = {
  diffAdded: 'rgb(34,92,43)',
  diffRemoved: 'rgb(122,41,54)',
  diffAddedDimmed: 'rgb(71,88,74)',
  diffRemovedDimmed: 'rgb(105,72,77)',
  diffAddedWord: 'rgb(56,166,96)',
  diffRemovedWord: 'rgb(179,89,107)',
  diffAddedWordDimmed: 'rgb(46,107,58)',
  diffRemovedWordDimmed: 'rgb(139,57,69)',
};

const LIGHT_BASELINE: DiffColors = {
  diffAdded: 'rgb(105,219,124)',
  diffRemoved: 'rgb(255,168,180)',
  diffAddedDimmed: 'rgb(199,225,203)',
  diffRemovedDimmed: 'rgb(253,210,216)',
  diffAddedWord: 'rgb(47,157,68)',
  diffRemovedWord: 'rgb(209,69,75)',
  diffAddedWordDimmed: 'rgb(144,194,156)',
  diffRemovedWordDimmed: 'rgb(232,165,173)',
};

const rgbStringToRgb = (value: string): Rgb | null => {
  const match = value.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/i);
  if (!match) return null;
  return {
    r: clamp(Number(match[1])),
    g: clamp(Number(match[2])),
    b: clamp(Number(match[3])),
  };
};

export function buildDiffPalette(input: DiffPaletteInput): DiffColors {
  const baseLum = luminance(hexToRgb(input.base));
  const baseline = baseLum < 0.35 ? DARK_BASELINE : LIGHT_BASELINE;

  if (!input.tint) return baseline;
  const tint = hexToRgb(input.tint);

  // Keep tint extremely subtle to preserve baseline readability.
  const tintWeight = baseLum < 0.35 ? 0.05 : 0.03;
  const applyTint = (value: string) => {
    const parsed = rgbStringToRgb(value);
    if (!parsed) return value;
    return rgbStr(mix(parsed, tint, tintWeight));
  };

  return {
    diffAdded: applyTint(baseline.diffAdded),
    diffRemoved: applyTint(baseline.diffRemoved),
    diffAddedDimmed: applyTint(baseline.diffAddedDimmed),
    diffRemovedDimmed: applyTint(baseline.diffRemovedDimmed),
    diffAddedWord: applyTint(baseline.diffAddedWord),
    diffRemovedWord: applyTint(baseline.diffRemovedWord),
    diffAddedWordDimmed: applyTint(baseline.diffAddedWordDimmed),
    diffRemovedWordDimmed: applyTint(baseline.diffRemovedWordDimmed),
  };
}
