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

// Alibaba Cloud palette: purple, dark blue, aqua, white
const palette = {
  base: '#0d1117',
  surface: '#161b22',
  panel: '#21262d',
  border: '#30363d',
  borderStrong: '#484f58',
  text: '#f0f6fc',
  textMuted: '#8b949e',
  textDim: '#6e7681',
  purple: '#a371f7',
  purpleSoft: '#c9a8ff',
  purpleDeep: '#7c3aed',
  darkBlue: '#1f6feb',
  darkBlueSoft: '#58a6ff',
  darkBlueDeep: '#0d419d',
  aqua: '#2dd4bf',
  aquaSoft: '#5eead4',
  aquaDeep: '#14b8a6',
  white: '#ffffff',
  green: '#3fb950',
  red: '#f85149',
  orange: '#d29922',
};

const theme: Theme = {
  name: 'Alibaba Aurora',
  id: 'alibaba',
  colors: {
    autoAccept: rgb(palette.green),
    bashBorder: rgb(palette.aqua),
    claude: rgb(palette.purple),
    claudeShimmer: rgb(palette.purpleSoft),
    claudeBlue_FOR_SYSTEM_SPINNER: rgb(palette.darkBlue),
    claudeBlueShimmer_FOR_SYSTEM_SPINNER: rgb(palette.darkBlueSoft),
    permission: rgb(palette.darkBlue),
    permissionShimmer: rgb(palette.darkBlueSoft),
    planMode: rgb(palette.green),
    ide: rgb(palette.darkBlueSoft),
    promptBorder: rgb(palette.border),
    promptBorderShimmer: rgb(palette.borderStrong),
    text: rgb(palette.text),
    inverseText: rgb(palette.base),
    inactive: rgb(palette.textDim),
    subtle: rgb(palette.border),
    suggestion: rgb(palette.darkBlueSoft),
    remember: rgb(palette.purple),
    background: rgb(palette.base),
    success: rgb(palette.green),
    error: rgb(palette.red),
    warning: rgb(palette.orange),
    warningShimmer: rgb(palette.aquaSoft),
    ...buildDiffPalette(),
    red_FOR_SUBAGENTS_ONLY: rgb(palette.red),
    blue_FOR_SUBAGENTS_ONLY: rgb(palette.darkBlueDeep),
    green_FOR_SUBAGENTS_ONLY: rgb(palette.green),
    yellow_FOR_SUBAGENTS_ONLY: rgb(palette.orange),
    purple_FOR_SUBAGENTS_ONLY: rgb(palette.purple),
    orange_FOR_SUBAGENTS_ONLY: rgb(palette.orange),
    pink_FOR_SUBAGENTS_ONLY: rgb(palette.purpleSoft),
    cyan_FOR_SUBAGENTS_ONLY: rgb(palette.aqua),
    professionalBlue: rgb(palette.darkBlueSoft),
    rainbow_red: rgb(palette.red),
    rainbow_orange: rgb(palette.orange),
    rainbow_yellow: rgb(palette.aqua),
    rainbow_green: rgb(palette.green),
    rainbow_blue: rgb(palette.darkBlue),
    rainbow_indigo: rgb(palette.purpleDeep),
    rainbow_violet: rgb(palette.purple),
    rainbow_red_shimmer: lighten(palette.red, 0.35),
    rainbow_orange_shimmer: lighten(palette.orange, 0.35),
    rainbow_yellow_shimmer: lighten(palette.aqua, 0.25),
    rainbow_green_shimmer: lighten(palette.green, 0.35),
    rainbow_blue_shimmer: lighten(palette.darkBlue, 0.35),
    rainbow_indigo_shimmer: lighten(palette.purpleDeep, 0.35),
    rainbow_violet_shimmer: lighten(palette.purple, 0.35),
    clawd_body: rgb(palette.purple),
    clawd_background: rgb(palette.base),
    userMessageBackground: mix(palette.panel, palette.purple, 0.15),
    bashMessageBackgroundColor: mix(palette.panel, palette.aqua, 0.08),
    memoryBackgroundColor: mix(palette.panel, palette.darkBlue, 0.12),
    rate_limit_fill: rgb(palette.purple),
    rate_limit_empty: rgb(palette.borderStrong),
  },
};

export const buildAlibabaTweakccConfig = (): TweakccConfig => ({
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
        'Computing',
        'Processing',
        'Analyzing',
        'Optimizing',
        'Routing',
        'Mapping',
        'Synthesizing',
        'Compiling',
        'Refining',
        'Validating',
        'Aligning',
        'Delivering',
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
      borderStyle: 'topBottomBold',
      borderColor: rgb(palette.purple),
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
