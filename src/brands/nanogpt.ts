import type { TweakccConfig, Theme } from './types.js';
import { DEFAULT_THEMES } from './defaultThemes.js';
import { buildBrandMiscConfig } from './miscDefaults.js';
import { formatUserMessage, getUserLabel } from './userLabel.js';

type Rgb = { r: number; g: number; b: number };

const clamp = (value: number) => Math.max(0, Math.min(255, Math.round(value)));

const hexToRgb = (hex: string): Rgb => {
  const normalized = hex.replace('#', '').trim();
  if (normalized.length === 3) {
    const [r, g, b] = normalized.split('');
    return {
      r: clamp(parseInt(r + r, 16)),
      g: clamp(parseInt(g + g, 16)),
      b: clamp(parseInt(b + b, 16)),
    };
  }
  if (normalized.length !== 6) {
    throw new Error(`Unsupported hex color: ${hex}`);
  }
  return {
    r: clamp(parseInt(normalized.slice(0, 2), 16)),
    g: clamp(parseInt(normalized.slice(2, 4), 16)),
    b: clamp(parseInt(normalized.slice(4, 6), 16)),
  };
};

const rgb = (hex: string) => {
  const { r, g, b } = hexToRgb(hex);
  return `rgb(${r},${g},${b})`;
};

const mix = (hexA: string, hexB: string, weight: number) => {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  const w = Math.max(0, Math.min(1, weight));
  return `rgb(${clamp(a.r + (b.r - a.r) * w)},${clamp(a.g + (b.g - a.g) * w)},${clamp(a.b + (b.b - a.b) * w)})`;
};

const lighten = (hex: string, weight: number) => mix(hex, '#ffffff', weight);

// NanoGPT brand colors: teal-to-cyan gradient from their crystal logo
// Theme: dark base with teal/cyan accents matching the splash art
const palette = {
  base: '#0c1520',
  surface: '#111d2b',
  panel: '#142231',
  border: '#1e3448',
  borderStrong: '#2a4a64',
  text: '#e8f0f8',
  textMuted: '#b8cad8',
  textDim: '#6b8aa0',
  teal: '#22d3ee', // Core brand teal (matches ANSI 81)
  tealBright: '#67e8f9', // Light cyan
  tealDeep: '#0891b2', // Deep teal
  aqua: '#06b6d4', // Mid cyan
  green: '#34d399',
  red: '#fb7185',
  orange: '#f59e0b',
  purple: '#8b5cf6',
};

const theme: Theme = {
  name: 'NanoGPT Teal',
  id: 'nanogpt-teal',
  colors: {
    autoAccept: rgb(palette.green),
    bashBorder: rgb(palette.teal),
    claude: rgb(palette.teal),
    claudeShimmer: lighten(palette.tealBright, 0.2),
    claudeBlue_FOR_SYSTEM_SPINNER: rgb(palette.aqua),
    claudeBlueShimmer_FOR_SYSTEM_SPINNER: lighten(palette.tealBright, 0.2),
    permission: rgb(palette.aqua),
    permissionShimmer: lighten(palette.aqua, 0.25),
    planMode: rgb(palette.tealDeep),
    ide: rgb(palette.tealBright),
    promptBorder: rgb(palette.border),
    promptBorderShimmer: rgb(palette.borderStrong),
    text: rgb(palette.text),
    inverseText: rgb(palette.base),
    inactive: rgb(palette.textDim),
    subtle: mix(palette.base, palette.teal, 0.15),
    suggestion: rgb(palette.tealBright),
    remember: rgb(palette.teal),
    background: rgb(palette.base),
    success: rgb(palette.green),
    error: rgb(palette.red),
    warning: rgb(palette.orange),
    warningShimmer: lighten(palette.orange, 0.2),
    diffAdded: mix(palette.base, palette.green, 0.18),
    diffRemoved: mix(palette.base, palette.red, 0.18),
    diffAddedDimmed: mix(palette.base, palette.green, 0.1),
    diffRemovedDimmed: mix(palette.base, palette.red, 0.1),
    diffAddedWord: mix(palette.base, palette.green, 0.45),
    diffRemovedWord: mix(palette.base, palette.red, 0.45),
    diffAddedWordDimmed: mix(palette.base, palette.green, 0.3),
    diffRemovedWordDimmed: mix(palette.base, palette.red, 0.3),
    red_FOR_SUBAGENTS_ONLY: rgb(palette.red),
    blue_FOR_SUBAGENTS_ONLY: rgb(palette.tealDeep),
    green_FOR_SUBAGENTS_ONLY: rgb(palette.green),
    yellow_FOR_SUBAGENTS_ONLY: rgb(palette.orange),
    purple_FOR_SUBAGENTS_ONLY: rgb(palette.purple),
    orange_FOR_SUBAGENTS_ONLY: rgb(palette.orange),
    pink_FOR_SUBAGENTS_ONLY: lighten(palette.tealBright, 0.3),
    cyan_FOR_SUBAGENTS_ONLY: rgb(palette.tealBright),
    professionalBlue: rgb(palette.aqua),
    rainbow_red: rgb(palette.red),
    rainbow_orange: rgb(palette.orange),
    rainbow_yellow: lighten(palette.orange, 0.18),
    rainbow_green: rgb(palette.green),
    rainbow_blue: rgb(palette.tealBright),
    rainbow_indigo: rgb(palette.tealDeep),
    rainbow_violet: rgb(palette.purple),
    rainbow_red_shimmer: lighten(palette.red, 0.35),
    rainbow_orange_shimmer: lighten(palette.orange, 0.35),
    rainbow_yellow_shimmer: lighten(palette.orange, 0.25),
    rainbow_green_shimmer: lighten(palette.green, 0.35),
    rainbow_blue_shimmer: lighten(palette.tealBright, 0.35),
    rainbow_indigo_shimmer: lighten(palette.tealDeep, 0.35),
    rainbow_violet_shimmer: lighten(palette.purple, 0.35),
    clawd_body: rgb(palette.teal),
    clawd_background: rgb(palette.base),
    userMessageBackground: rgb(palette.panel),
    bashMessageBackgroundColor: rgb(palette.surface),
    memoryBackgroundColor: mix(palette.panel, palette.teal, 0.12),
    rate_limit_fill: rgb(palette.teal),
    rate_limit_empty: rgb(palette.borderStrong),
  },
};

export const buildNanoGPTTweakccConfig = (): TweakccConfig => ({
  ccVersion: '',
  ccInstallationPath: null,
  lastModified: new Date().toISOString(),
  changesApplied: false,
  hidePiebaldAnnouncement: true,
  settings: {
    themes: [theme, ...DEFAULT_THEMES],
    thinkingVerbs: {
      format: '{}... ',
      verbs: [
        'Nano-tuning',
        'Vectorizing',
        'Synthesizing',
        'Batching',
        'Optimizing',
        'Indexing',
        'Sampling',
        'Compressing',
        'Shaping',
        'Refining',
      ],
    },
    thinkingStyle: {
      updateInterval: 118,
      phases: ['·', '•', '◦', '•'],
      reverseMirror: false,
    },
    userMessageDisplay: {
      format: formatUserMessage(getUserLabel()),
      styling: ['bold'],
      foregroundColor: 'default',
      backgroundColor: 'default',
      borderStyle: 'topBottomSingle',
      borderColor: rgb(palette.teal),
      paddingX: 1,
      paddingY: 0,
      fitBoxToContent: true,
    },
    inputBox: {
      removeBorder: true,
    },
    misc: buildBrandMiscConfig(),
    claudeMdAltNames: null,
  },
});
