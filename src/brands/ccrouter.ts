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
  base: '#edf6ff',
  surface: '#f6fbff',
  panel: '#e3f0fb',
  border: '#c5d9ee',
  borderStrong: '#9fb9d8',
  text: '#162434',
  textMuted: '#3f546b',
  textDim: '#6b7f95',
  sky: '#4da3ff',
  skySoft: '#7bbcff',
  skyDeep: '#2a6fcb',
  cyan: '#6cc7ff',
  green: '#3aa876',
  red: '#d34e5c',
  orange: '#e59b3e',
  purple: '#6b7dd8',
};

const theme: Theme = {
  name: 'CCRouter Sky',
  id: 'ccrouter-sky',
  colors: {
    autoAccept: rgb(palette.green),
    bashBorder: rgb(palette.sky),
    claude: rgb(palette.skyDeep),
    claudeShimmer: lighten(palette.sky, 0.35),
    claudeBlue_FOR_SYSTEM_SPINNER: rgb(palette.sky),
    claudeBlueShimmer_FOR_SYSTEM_SPINNER: lighten(palette.skySoft, 0.2),
    permission: rgb(palette.cyan),
    permissionShimmer: lighten(palette.cyan, 0.25),
    planMode: rgb(palette.skyDeep),
    ide: rgb(palette.cyan),
    promptBorder: rgb(palette.border),
    promptBorderShimmer: rgb(palette.borderStrong),
    text: rgb(palette.text),
    inverseText: rgb(palette.base),
    inactive: rgb(palette.textDim),
    subtle: mix(palette.base, palette.skySoft, 0.15),
    suggestion: rgb(palette.skySoft),
    remember: rgb(palette.skyDeep),
    background: rgb(palette.base),
    success: rgb(palette.green),
    error: rgb(palette.red),
    warning: rgb(palette.orange),
    warningShimmer: lighten(palette.orange, 0.28),
    ...buildDiffPalette({ base: palette.base, added: palette.green, removed: palette.red, tint: palette.sky }),
    red_FOR_SUBAGENTS_ONLY: rgb(palette.red),
    blue_FOR_SUBAGENTS_ONLY: rgb(palette.skyDeep),
    green_FOR_SUBAGENTS_ONLY: rgb(palette.green),
    yellow_FOR_SUBAGENTS_ONLY: rgb(palette.orange),
    purple_FOR_SUBAGENTS_ONLY: rgb(palette.purple),
    orange_FOR_SUBAGENTS_ONLY: rgb(palette.orange),
    pink_FOR_SUBAGENTS_ONLY: lighten(palette.purple, 0.32),
    cyan_FOR_SUBAGENTS_ONLY: rgb(palette.cyan),
    professionalBlue: rgb(palette.sky),
    rainbow_red: rgb(palette.red),
    rainbow_orange: rgb(palette.orange),
    rainbow_yellow: lighten(palette.orange, 0.18),
    rainbow_green: rgb(palette.green),
    rainbow_blue: rgb(palette.skySoft),
    rainbow_indigo: rgb(palette.skyDeep),
    rainbow_violet: rgb(palette.purple),
    rainbow_red_shimmer: lighten(palette.red, 0.35),
    rainbow_orange_shimmer: lighten(palette.orange, 0.35),
    rainbow_yellow_shimmer: lighten(palette.orange, 0.3),
    rainbow_green_shimmer: lighten(palette.green, 0.35),
    rainbow_blue_shimmer: lighten(palette.skySoft, 0.35),
    rainbow_indigo_shimmer: lighten(palette.skyDeep, 0.35),
    rainbow_violet_shimmer: lighten(palette.purple, 0.35),
    clawd_body: rgb(palette.skyDeep),
    clawd_background: rgb(palette.base),
    userMessageBackground: rgb(palette.panel),
    bashMessageBackgroundColor: rgb(palette.surface),
    memoryBackgroundColor: mix(palette.panel, palette.skySoft, 0.12),
    rate_limit_fill: rgb(palette.sky),
    rate_limit_empty: rgb(palette.borderStrong),
  },
};

export const buildCCRouterTweakccConfig = (): TweakccConfig => ({
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
        'Routing',
        'Switching',
        'Proxying',
        'Forwarding',
        'Dispatching',
        'Negotiating',
        'Bridging',
        'Mapping',
        'Tunneling',
        'Resolving',
        'Balancing',
        'Indexing',
        'Synchronizing',
        'Finalizing',
      ],
    },
    thinkingStyle: {
      updateInterval: 115,
      phases: ['·', '•', '◦', '•'],
      reverseMirror: false,
    },
    userMessageDisplay: {
      format: formatUserMessage(getUserLabel()),
      styling: ['bold'],
      foregroundColor: 'default',
      backgroundColor: 'default',
      borderStyle: 'topBottomDouble',
      borderColor: rgb(palette.sky),
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
