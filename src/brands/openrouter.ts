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

// OpenRouter brand colors: #284968 (navy), #6467f2 (cornflower blue)
// Theme: professional dark navy with vibrant blue accents
const palette = {
  base: '#f0f4f8',
  surface: '#f7f9fc',
  panel: '#e4eaf2',
  border: '#c0cfdf',
  borderStrong: '#8da4be',
  text: '#1a2332',
  textMuted: '#3d4f66',
  textDim: '#5c6f88',
  navy: '#284968', // Brand primary - dark navy
  navyBright: '#3a6590',
  navyDeep: '#1a3048',
  indigo: '#6467f2', // Brand accent - cornflower blue
  indigoSoft: '#8a8df5',
  green: '#2f9b6d',
  red: '#d04b5a',
  orange: '#d28a3c',
  purple: '#6467f2',
};

const theme: Theme = {
  name: 'OpenRouter Navy',
  id: 'openrouter-navy',
  colors: {
    autoAccept: rgb(palette.green),
    bashBorder: rgb(palette.navy),
    claude: rgb(palette.navyDeep),
    claudeShimmer: lighten(palette.navy, 0.35),
    claudeBlue_FOR_SYSTEM_SPINNER: rgb(palette.indigo),
    claudeBlueShimmer_FOR_SYSTEM_SPINNER: lighten(palette.indigoSoft, 0.2),
    permission: rgb(palette.indigo),
    permissionShimmer: lighten(palette.indigo, 0.25),
    planMode: rgb(palette.navyDeep),
    ide: rgb(palette.indigoSoft),
    promptBorder: rgb(palette.border),
    promptBorderShimmer: rgb(palette.borderStrong),
    text: rgb(palette.text),
    inverseText: rgb(palette.base),
    inactive: rgb(palette.textDim),
    subtle: mix(palette.base, palette.navyBright, 0.12),
    suggestion: rgb(palette.indigoSoft),
    remember: rgb(palette.navyDeep),
    background: rgb(palette.base),
    success: rgb(palette.green),
    error: rgb(palette.red),
    warning: rgb(palette.orange),
    warningShimmer: lighten(palette.orange, 0.28),
    ...buildDiffPalette({ base: palette.base, added: palette.green, removed: palette.red, tint: palette.indigo }),
    red_FOR_SUBAGENTS_ONLY: rgb(palette.red),
    blue_FOR_SUBAGENTS_ONLY: rgb(palette.navyDeep),
    green_FOR_SUBAGENTS_ONLY: rgb(palette.green),
    yellow_FOR_SUBAGENTS_ONLY: rgb(palette.orange),
    purple_FOR_SUBAGENTS_ONLY: rgb(palette.purple),
    orange_FOR_SUBAGENTS_ONLY: rgb(palette.orange),
    pink_FOR_SUBAGENTS_ONLY: lighten(palette.purple, 0.32),
    cyan_FOR_SUBAGENTS_ONLY: rgb(palette.indigoSoft),
    professionalBlue: rgb(palette.navy),
    rainbow_red: rgb(palette.red),
    rainbow_orange: rgb(palette.orange),
    rainbow_yellow: lighten(palette.orange, 0.18),
    rainbow_green: rgb(palette.green),
    rainbow_blue: rgb(palette.indigoSoft),
    rainbow_indigo: rgb(palette.navyDeep),
    rainbow_violet: rgb(palette.purple),
    rainbow_red_shimmer: lighten(palette.red, 0.35),
    rainbow_orange_shimmer: lighten(palette.orange, 0.35),
    rainbow_yellow_shimmer: lighten(palette.orange, 0.3),
    rainbow_green_shimmer: lighten(palette.green, 0.35),
    rainbow_blue_shimmer: lighten(palette.indigoSoft, 0.35),
    rainbow_indigo_shimmer: lighten(palette.navyDeep, 0.35),
    rainbow_violet_shimmer: lighten(palette.purple, 0.35),
    clawd_body: rgb(palette.navyDeep),
    clawd_background: rgb(palette.base),
    userMessageBackground: rgb(palette.panel),
    bashMessageBackgroundColor: rgb(palette.surface),
    memoryBackgroundColor: mix(palette.panel, palette.navyBright, 0.12),
    rate_limit_fill: rgb(palette.navy),
    rate_limit_empty: rgb(palette.borderStrong),
  },
};

export const buildOpenRouterTweakccConfig = (): TweakccConfig => ({
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
        'Switchboarding',
        'Proxying',
        'Negotiating',
        'Handshake',
        'Bridging',
        'Mapping',
        'Tunneling',
        'Resolving',
        'Balancing',
        'Rewriting',
        'Indexing',
        'Synchronizing',
        'Aligning',
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
      borderColor: rgb(palette.navy),
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
