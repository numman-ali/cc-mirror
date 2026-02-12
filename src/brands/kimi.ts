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

// Kimi Code: dark base with aurora green + cyan accents.
const palette = {
  base: '#070b0a',
  surface: '#0c1411',
  panel: '#0f1d18',
  border: '#1c2d25',
  borderStrong: '#2a4034',
  text: '#eafff3',
  textMuted: '#c8e8d6',
  textDim: '#8db7a2',
  aurora: '#00e676',
  auroraSoft: '#74ffb8',
  cyan: '#00d1ff',
  cyanSoft: '#7ae8ff',
  lime: '#b6ff00',
  purple: '#7c3aed',
  green: '#22c55e',
  red: '#ff3b3b',
  orange: '#ff8c42',
  yellow: '#ffe066',
};

const tint = (hex: string, weight: number) => mix(palette.base, hex, weight);

const theme: Theme = {
  name: 'Kimi Aurora',
  id: 'kimi-aurora',
  colors: {
    autoAccept: rgb(palette.green),
    bashBorder: rgb(palette.aurora),
    claude: rgb(palette.aurora),
    claudeShimmer: lighten(palette.auroraSoft, 0.2),
    claudeBlue_FOR_SYSTEM_SPINNER: rgb(palette.cyan),
    claudeBlueShimmer_FOR_SYSTEM_SPINNER: lighten(palette.cyanSoft, 0.2),
    permission: rgb(palette.cyan),
    permissionShimmer: lighten(palette.cyanSoft, 0.15),
    planMode: rgb(palette.lime),
    ide: rgb(palette.cyanSoft),
    promptBorder: rgb(palette.border),
    promptBorderShimmer: rgb(palette.borderStrong),
    text: rgb(palette.text),
    inverseText: rgb(palette.base),
    inactive: rgb(palette.textDim),
    subtle: tint(palette.aurora, 0.14),
    suggestion: rgb(palette.purple),
    remember: rgb(palette.aurora),
    background: rgb(palette.base),
    success: rgb(palette.green),
    error: rgb(palette.red),
    warning: rgb(palette.yellow),
    warningShimmer: lighten(palette.yellow, 0.25),
    diffAdded: mix(palette.base, palette.green, 0.18),
    diffRemoved: mix(palette.base, palette.red, 0.18),
    diffAddedDimmed: mix(palette.base, palette.green, 0.1),
    diffRemovedDimmed: mix(palette.base, palette.red, 0.1),
    diffAddedWord: mix(palette.base, palette.green, 0.45),
    diffRemovedWord: mix(palette.base, palette.red, 0.45),
    diffAddedWordDimmed: mix(palette.base, palette.green, 0.3),
    diffRemovedWordDimmed: mix(palette.base, palette.red, 0.3),
    red_FOR_SUBAGENTS_ONLY: rgb(palette.red),
    blue_FOR_SUBAGENTS_ONLY: rgb(palette.cyan),
    green_FOR_SUBAGENTS_ONLY: rgb(palette.green),
    yellow_FOR_SUBAGENTS_ONLY: rgb(palette.yellow),
    purple_FOR_SUBAGENTS_ONLY: rgb(palette.purple),
    orange_FOR_SUBAGENTS_ONLY: rgb(palette.orange),
    pink_FOR_SUBAGENTS_ONLY: lighten(palette.purple, 0.25),
    cyan_FOR_SUBAGENTS_ONLY: rgb(palette.cyanSoft),
    professionalBlue: rgb(palette.cyan),
    rainbow_red: rgb(palette.red),
    rainbow_orange: rgb(palette.orange),
    rainbow_yellow: rgb(palette.yellow),
    rainbow_green: rgb(palette.green),
    rainbow_blue: rgb(palette.cyan),
    rainbow_indigo: rgb(palette.purple),
    rainbow_violet: rgb(palette.aurora),
    rainbow_red_shimmer: lighten(palette.red, 0.35),
    rainbow_orange_shimmer: lighten(palette.orange, 0.35),
    rainbow_yellow_shimmer: lighten(palette.yellow, 0.25),
    rainbow_green_shimmer: lighten(palette.green, 0.35),
    rainbow_blue_shimmer: lighten(palette.cyanSoft, 0.35),
    rainbow_indigo_shimmer: lighten(palette.purple, 0.35),
    rainbow_violet_shimmer: lighten(palette.auroraSoft, 0.2),
    clawd_body: rgb(palette.aurora),
    clawd_background: rgb(palette.base),
    userMessageBackground: rgb(palette.panel),
    bashMessageBackgroundColor: rgb(palette.surface),
    memoryBackgroundColor: tint(palette.panel, 0.2),
    rate_limit_fill: rgb(palette.aurora),
    rate_limit_empty: rgb(palette.borderStrong),
  },
};

export const buildKimiTweakccConfig = (): TweakccConfig => ({
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
        'Sparking',
        'Glinting',
        'Flowing',
        'Weaving',
        'Indexing',
        'Synthesizing',
        'Refining',
        'Composing',
        'Routing',
        'Resolving',
        'Calibrating',
        'Compiling',
      ],
    },
    thinkingStyle: {
      updateInterval: 95,
      phases: ['·', '•', '◦', '•'],
      reverseMirror: false,
    },
    userMessageDisplay: {
      format: formatUserMessage(getUserLabel()),
      styling: ['bold'],
      foregroundColor: 'default',
      backgroundColor: 'default',
      borderStyle: 'topBottomBold',
      borderColor: rgb(palette.aurora),
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
