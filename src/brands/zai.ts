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

const palette = {
  base: '#191b1e',
  surface: '#222529',
  panel: '#292d33',
  border: '#3e4350',
  borderStrong: '#545a6a',
  text: '#eff0f3',
  textMuted: '#cdd0d8',
  textDim: '#9a9daa',
  gold: '#ffd373',
  goldSoft: '#ffe4a8',
  goldDeep: '#b2892e',
  blue: '#0080ff',
  blueSoft: '#66b3ff',
  blueDeep: '#134cff',
  green: '#37d995',
  red: '#fb2c36',
  orange: '#ff8e42',
  purple: '#9c8bff',
};

const theme: Theme = {
  name: 'Z.ai Carbon',
  id: 'dark',
  colors: {
    autoAccept: rgb(palette.green),
    bashBorder: rgb(palette.gold),
    claude: rgb(palette.gold),
    claudeShimmer: rgb(palette.goldSoft),
    claudeBlue_FOR_SYSTEM_SPINNER: rgb(palette.blue),
    claudeBlueShimmer_FOR_SYSTEM_SPINNER: rgb(palette.blueSoft),
    permission: rgb(palette.blue),
    permissionShimmer: rgb(palette.blueSoft),
    planMode: rgb(palette.green),
    ide: rgb(palette.blueSoft),
    promptBorder: rgb(palette.border),
    promptBorderShimmer: rgb(palette.borderStrong),
    text: rgb(palette.text),
    inverseText: rgb(palette.base),
    inactive: rgb(palette.textDim),
    subtle: rgb(palette.border),
    suggestion: rgb(palette.blueSoft),
    remember: rgb(palette.gold),
    background: rgb(palette.base),
    success: rgb(palette.green),
    error: rgb(palette.red),
    warning: rgb(palette.orange),
    warningShimmer: rgb(palette.goldSoft),
    ...buildDiffPalette(),
    red_FOR_SUBAGENTS_ONLY: rgb(palette.red),
    blue_FOR_SUBAGENTS_ONLY: rgb(palette.blueDeep),
    green_FOR_SUBAGENTS_ONLY: rgb(palette.green),
    yellow_FOR_SUBAGENTS_ONLY: rgb(palette.gold),
    purple_FOR_SUBAGENTS_ONLY: rgb(palette.purple),
    orange_FOR_SUBAGENTS_ONLY: rgb(palette.orange),
    pink_FOR_SUBAGENTS_ONLY: rgb(palette.goldSoft),
    cyan_FOR_SUBAGENTS_ONLY: rgb(palette.blueSoft),
    professionalBlue: rgb(palette.blueSoft),
    rainbow_red: rgb(palette.red),
    rainbow_orange: rgb(palette.orange),
    rainbow_yellow: rgb(palette.gold),
    rainbow_green: rgb(palette.green),
    rainbow_blue: rgb(palette.blue),
    rainbow_indigo: rgb(palette.blueDeep),
    rainbow_violet: rgb(palette.purple),
    rainbow_red_shimmer: lighten(palette.red, 0.35),
    rainbow_orange_shimmer: lighten(palette.orange, 0.35),
    rainbow_yellow_shimmer: lighten(palette.gold, 0.25),
    rainbow_green_shimmer: lighten(palette.green, 0.35),
    rainbow_blue_shimmer: lighten(palette.blue, 0.35),
    rainbow_indigo_shimmer: lighten(palette.blueDeep, 0.35),
    rainbow_violet_shimmer: lighten(palette.purple, 0.35),
    clawd_body: rgb(palette.gold),
    clawd_background: rgb(palette.base),
    userMessageBackground: mix('#383838', palette.gold, 0.12),
    bashMessageBackgroundColor: mix('#404040', palette.gold, 0.08),
    memoryBackgroundColor: mix('#383838', palette.blue, 0.1),
    rate_limit_fill: rgb(palette.gold),
    rate_limit_empty: rgb(palette.borderStrong),
  },
};

export const buildZaiTweakccConfig = (): TweakccConfig => ({
  ccVersion: '',
  ccInstallationPath: null,
  lastModified: new Date().toISOString(),
  changesApplied: false,
  hidePiebaldAnnouncement: true,
  settings: {
    themes: [theme, ...DEFAULT_THEMES.filter((t) => t.id !== theme.id)],
    thinkingVerbs: {
      format: '{}... ',
      verbs: [
        'Calibrating',
        'Indexing',
        'Synthesizing',
        'Optimizing',
        'Routing',
        'Vectorizing',
        'Mapping',
        'Compiling',
        'Refining',
        'Auditing',
        'Aligning',
        'Balancing',
        'Forecasting',
        'Resolving',
        'Validating',
        'Benchmarking',
        'Assembling',
        'Delivering',
      ],
    },
    thinkingStyle: {
      updateInterval: 110,
      phases: ['.', 'o', 'O', '0', 'O', 'o'],
      reverseMirror: false,
    },
    userMessageDisplay: {
      format: formatUserMessage(getUserLabel()),
      styling: ['bold'],
      foregroundColor: 'default',
      backgroundColor: 'default',
      borderStyle: 'topBottomBold',
      borderColor: rgb(palette.gold),
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
