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

// OpenRouter brand colors: #284968 (navy), #3b82f6 (true blue)
// Theme: dark navy workspace with clean blue + warm amber routing accents.
const palette = {
  base: '#0c1220',
  surface: '#111928',
  panel: '#152034',
  border: '#243550',
  borderStrong: '#345070',
  text: '#e8f0fa',
  textMuted: '#b8c8dc',
  textDim: '#7a90b0',
  navy: '#284968', // Brand primary - dark navy
  navyBright: '#4a88c0',
  navyDeep: '#1a3048',
  blue: '#3b82f6', // Brand accent - clean true blue (no purple drift)
  blueSoft: '#60a5fa',
  amber: '#f59e0b', // Routing signal warm accent
  amberSoft: '#fbbf24',
  green: '#22c55e',
  red: '#ef4444',
  orange: '#f97316',
};

const theme: Theme = {
  name: 'OpenRouter Navy',
  id: 'dark',
  colors: {
    autoAccept: rgb(palette.green),
    bashBorder: rgb(palette.blue),
    claude: rgb(palette.navy),
    claudeShimmer: lighten(palette.navyBright, 0.3),
    claudeBlue_FOR_SYSTEM_SPINNER: rgb(palette.blue),
    claudeBlueShimmer_FOR_SYSTEM_SPINNER: lighten(palette.blueSoft, 0.2),
    permission: rgb(palette.amber),
    permissionShimmer: rgb(palette.amberSoft),
    planMode: rgb(palette.navyBright),
    ide: rgb(palette.blueSoft),
    promptBorder: rgb(palette.border),
    promptBorderShimmer: rgb(palette.borderStrong),
    text: rgb(palette.text),
    inverseText: rgb(palette.base),
    inactive: rgb(palette.textDim),
    subtle: mix(palette.base, palette.blue, 0.12),
    suggestion: rgb(palette.blueSoft),
    remember: rgb(palette.amber),
    background: rgb(palette.base),
    success: rgb(palette.green),
    error: rgb(palette.red),
    warning: rgb(palette.orange),
    warningShimmer: lighten(palette.orange, 0.28),
    ...buildDiffPalette(),
    red_FOR_SUBAGENTS_ONLY: rgb(palette.red),
    blue_FOR_SUBAGENTS_ONLY: rgb(palette.navyDeep),
    green_FOR_SUBAGENTS_ONLY: rgb(palette.green),
    yellow_FOR_SUBAGENTS_ONLY: rgb(palette.amber),
    purple_FOR_SUBAGENTS_ONLY: rgb(palette.navyBright),
    orange_FOR_SUBAGENTS_ONLY: rgb(palette.orange),
    pink_FOR_SUBAGENTS_ONLY: lighten(palette.amber, 0.32),
    cyan_FOR_SUBAGENTS_ONLY: rgb(palette.blueSoft),
    professionalBlue: rgb(palette.blue),
    rainbow_red: rgb(palette.red),
    rainbow_orange: rgb(palette.orange),
    rainbow_yellow: rgb(palette.amber),
    rainbow_green: rgb(palette.green),
    rainbow_blue: rgb(palette.blueSoft),
    rainbow_indigo: rgb(palette.navy),
    rainbow_violet: rgb(palette.navyBright),
    rainbow_red_shimmer: lighten(palette.red, 0.35),
    rainbow_orange_shimmer: lighten(palette.orange, 0.35),
    rainbow_yellow_shimmer: lighten(palette.amber, 0.25),
    rainbow_green_shimmer: lighten(palette.green, 0.35),
    rainbow_blue_shimmer: lighten(palette.blueSoft, 0.35),
    rainbow_indigo_shimmer: lighten(palette.navy, 0.35),
    rainbow_violet_shimmer: lighten(palette.navyBright, 0.35),
    clawd_body: rgb(palette.navy),
    clawd_background: rgb(palette.base),
    userMessageBackground: mix('#383838', palette.blue, 0.12),
    bashMessageBackgroundColor: mix('#404040', palette.blue, 0.08),
    memoryBackgroundColor: mix('#383838', palette.navyBright, 0.1),
    rate_limit_fill: rgb(palette.blue),
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
    themes: [theme, ...DEFAULT_THEMES.filter((t) => t.id !== theme.id)],
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
      borderColor: rgb(palette.blue),
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
