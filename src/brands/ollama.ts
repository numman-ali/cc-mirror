import type { TweakccConfig, Theme } from './types.js';
import { DEFAULT_THEMES } from './defaultThemes.js';
import { buildBrandMiscConfig } from './miscDefaults.js';
import { buildDiffPalette } from './diffPalette.js';
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

// Ollama brand colors: #caad8d (sorrel brown), black, white
// Theme: warm earthy llama tones with sandstone accents
const palette = {
  base: '#15110d',
  surface: '#1f1711',
  panel: '#281e16',
  border: '#4a3828',
  borderStrong: '#6d5138',
  text: '#f2e8dc',
  textMuted: '#d5c3ad',
  textDim: '#a88f76',
  llama: '#caad8d', // Brand primary - sorrel brown
  llamaBright: '#dcc4a8',
  llamaDeep: '#8d6e52',
  sand: '#b9966e',
  green: '#2fb37f',
  red: '#e06b7a',
  orange: '#c98a4d',
  blue: '#6e8fae',
};

const theme: Theme = {
  name: 'Ollama Llama',
  id: 'ollama-llama',
  colors: {
    autoAccept: rgb(palette.green),
    bashBorder: rgb(palette.llama),
    claude: rgb(palette.llamaDeep),
    claudeShimmer: lighten(palette.llama, 0.35),
    claudeBlue_FOR_SYSTEM_SPINNER: rgb(palette.llama),
    claudeBlueShimmer_FOR_SYSTEM_SPINNER: lighten(palette.llamaBright, 0.2),
    permission: rgb(palette.sand),
    permissionShimmer: lighten(palette.sand, 0.25),
    planMode: rgb(palette.llamaDeep),
    ide: rgb(palette.llamaBright),
    promptBorder: rgb(palette.border),
    promptBorderShimmer: rgb(palette.borderStrong),
    text: rgb(palette.text),
    inverseText: rgb(palette.base),
    inactive: rgb(palette.textDim),
    subtle: mix(palette.base, palette.llamaBright, 0.12),
    suggestion: rgb(palette.llamaBright),
    remember: rgb(palette.llamaDeep),
    background: rgb(palette.base),
    success: rgb(palette.green),
    error: rgb(palette.red),
    warning: rgb(palette.orange),
    warningShimmer: lighten(palette.orange, 0.28),
    ...buildDiffPalette({ base: palette.base, added: palette.green, removed: palette.red, tint: palette.llama }),
    red_FOR_SUBAGENTS_ONLY: rgb(palette.red),
    blue_FOR_SUBAGENTS_ONLY: rgb(palette.blue),
    green_FOR_SUBAGENTS_ONLY: rgb(palette.green),
    yellow_FOR_SUBAGENTS_ONLY: rgb(palette.orange),
    purple_FOR_SUBAGENTS_ONLY: rgb(palette.llama),
    orange_FOR_SUBAGENTS_ONLY: rgb(palette.orange),
    pink_FOR_SUBAGENTS_ONLY: lighten(palette.sand, 0.32),
    cyan_FOR_SUBAGENTS_ONLY: rgb(palette.llamaBright),
    professionalBlue: rgb(palette.llama),
    rainbow_red: rgb(palette.red),
    rainbow_orange: rgb(palette.orange),
    rainbow_yellow: lighten(palette.orange, 0.18),
    rainbow_green: rgb(palette.green),
    rainbow_blue: rgb(palette.llamaBright),
    rainbow_indigo: rgb(palette.llamaDeep),
    rainbow_violet: rgb(palette.llama),
    rainbow_red_shimmer: lighten(palette.red, 0.35),
    rainbow_orange_shimmer: lighten(palette.orange, 0.35),
    rainbow_yellow_shimmer: lighten(palette.orange, 0.3),
    rainbow_green_shimmer: lighten(palette.green, 0.35),
    rainbow_blue_shimmer: lighten(palette.llamaBright, 0.35),
    rainbow_indigo_shimmer: lighten(palette.llamaDeep, 0.35),
    rainbow_violet_shimmer: lighten(palette.llama, 0.35),
    clawd_body: rgb(palette.llamaDeep),
    clawd_background: rgb(palette.base),
    userMessageBackground: rgb(palette.panel),
    bashMessageBackgroundColor: rgb(palette.surface),
    memoryBackgroundColor: mix(palette.panel, palette.llamaBright, 0.12),
    rate_limit_fill: rgb(palette.llama),
    rate_limit_empty: rgb(palette.borderStrong),
  },
};

export const buildOllamaTweakccConfig = (): TweakccConfig => ({
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
        'Grazing',
        'Roaming',
        'Simmering',
        'Warming',
        'Kindling',
        'Steaming',
        'Trekking',
        'Ranging',
        'Loping',
        'Foraging',
        'Routing',
        'Saddling',
      ],
    },
    thinkingStyle: {
      updateInterval: 120,
      phases: ['·', '•', '◦', '•'],
      reverseMirror: false,
    },
    userMessageDisplay: {
      format: formatUserMessage(getUserLabel()),
      styling: ['bold'],
      foregroundColor: 'default',
      backgroundColor: 'default',
      borderStyle: 'topBottomSingle',
      borderColor: rgb(palette.llama),
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
