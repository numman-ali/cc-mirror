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

type Palette = {
  base: string;
  surface: string;
  panel: string;
  border: string;
  borderStrong: string;
  text: string;
  textMuted: string;
  textDim: string;
  core: string;
  deep: string;
  orange: string;
  yellow: string;
  cyan: string;
  blue: string;
  green: string;
  red: string;
};

const MINIMAX_CORE = '#a855f7';

const palette: Palette = {
  base: '#0a0a12',
  surface: '#12121e',
  panel: '#18182a',
  border: '#2a2a44',
  borderStrong: '#3d3d5c',
  text: '#eeeef8',
  textMuted: '#c4c4da',
  textDim: '#8888aa',
  core: MINIMAX_CORE,
  deep: '#7c3aed',
  orange: '#f59e0b',
  yellow: '#fbbf24',
  cyan: '#22d3ee',
  blue: '#6366f1',
  green: '#34d399',
  red: '#f43f5e',
};

const makeTheme = (): Theme => {
  const tint = (hex: string, weight: number) => mix(palette.base, hex, weight);
  return {
    name: 'MiniMax Nebula',
    id: 'dark',
    colors: {
      autoAccept: rgb(palette.green),
      bashBorder: rgb(palette.core),
      claude: rgb(palette.core),
      claudeShimmer: lighten(palette.core, 0.28),
      claudeBlue_FOR_SYSTEM_SPINNER: rgb(palette.blue),
      claudeBlueShimmer_FOR_SYSTEM_SPINNER: lighten(palette.blue, 0.3),
      permission: rgb(palette.orange),
      permissionShimmer: lighten(palette.orange, 0.25),
      planMode: rgb(palette.core),
      ide: rgb(palette.cyan),
      promptBorder: rgb(palette.border),
      promptBorderShimmer: rgb(palette.borderStrong),
      text: rgb(palette.text),
      inverseText: rgb(palette.base),
      inactive: rgb(palette.textDim),
      subtle: tint(palette.core, 0.18),
      suggestion: rgb(palette.deep),
      remember: rgb(palette.core),
      background: rgb(palette.base),
      success: rgb(palette.green),
      error: rgb(palette.red),
      warning: rgb(palette.yellow),
      warningShimmer: lighten(palette.yellow, 0.2),
      ...buildDiffPalette(),
      red_FOR_SUBAGENTS_ONLY: rgb(palette.red),
      blue_FOR_SUBAGENTS_ONLY: rgb(palette.blue),
      green_FOR_SUBAGENTS_ONLY: rgb(palette.green),
      yellow_FOR_SUBAGENTS_ONLY: rgb(palette.yellow),
      purple_FOR_SUBAGENTS_ONLY: rgb(palette.deep),
      orange_FOR_SUBAGENTS_ONLY: rgb(palette.orange),
      pink_FOR_SUBAGENTS_ONLY: rgb(palette.core),
      cyan_FOR_SUBAGENTS_ONLY: rgb(palette.cyan),
      professionalBlue: rgb(palette.blue),
      rainbow_red: rgb(palette.red),
      rainbow_orange: rgb(palette.orange),
      rainbow_yellow: rgb(palette.yellow),
      rainbow_green: rgb(palette.green),
      rainbow_blue: rgb(palette.cyan),
      rainbow_indigo: rgb(palette.blue),
      rainbow_violet: rgb(palette.core),
      rainbow_red_shimmer: lighten(palette.red, 0.35),
      rainbow_orange_shimmer: lighten(palette.orange, 0.35),
      rainbow_yellow_shimmer: lighten(palette.yellow, 0.25),
      rainbow_green_shimmer: lighten(palette.green, 0.35),
      rainbow_blue_shimmer: lighten(palette.cyan, 0.35),
      rainbow_indigo_shimmer: lighten(palette.blue, 0.35),
      rainbow_violet_shimmer: lighten(palette.core, 0.35),
      clawd_body: rgb(palette.core),
      clawd_background: rgb(palette.base),
      userMessageBackground: mix('#383838', palette.core, 0.12),
      bashMessageBackgroundColor: mix('#404040', palette.core, 0.08),
      memoryBackgroundColor: mix('#383838', palette.cyan, 0.1),
      rate_limit_fill: rgb(palette.core),
      rate_limit_empty: rgb(palette.borderStrong),
    },
  };
};

const pulseTheme = makeTheme();

export const buildMinimaxTweakccConfig = (): TweakccConfig => ({
  ccVersion: '',
  ccInstallationPath: null,
  lastModified: new Date().toISOString(),
  changesApplied: false,
  hidePiebaldAnnouncement: true,
  settings: {
    themes: [pulseTheme, ...DEFAULT_THEMES.filter((t) => t.id !== pulseTheme.id)],
    thinkingVerbs: {
      format: '{}... ',
      verbs: [
        'Warping',
        'Nebulizing',
        'Phasing',
        'Refracting',
        'Tunneling',
        'Ionizing',
        'Polarizing',
        'Cascading',
        'Crystallizing',
        'Entangling',
        'Diffracting',
        'Converging',
        'Pulsing',
        'Transcoding',
      ],
    },
    thinkingStyle: {
      updateInterval: 80,
      phases: ['⟡', '◈', '⬡', '◇', '⬡', '◈'],
      reverseMirror: false,
    },
    userMessageDisplay: {
      format: formatUserMessage(getUserLabel()),
      styling: ['bold'],
      foregroundColor: 'default',
      backgroundColor: 'default',
      borderStyle: 'topBottomDouble',
      borderColor: rgb(palette.core),
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
