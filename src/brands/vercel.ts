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

// Vercel brand colors: #0070F3 (blue ribbon), #171717 (cod gray), white
// Theme: dark monochrome shell with signature Vercel blue accents.
const palette = {
  base: '#0a0a0a',
  surface: '#111111',
  panel: '#171717',
  border: '#2b2b2b',
  borderStrong: '#3d3d3d',
  text: '#f5f5f5', // Brand-inspired monochrome
  textMuted: '#d4d4d4',
  textDim: '#9ca3af',
  ink: '#f5f5f5',
  inkSoft: '#cfcfcf',
  blue: '#0070f3', // Brand - blue ribbon
  blueSoft: '#3291ff',
  green: '#22c55e',
  red: '#f87171',
  orange: '#f59e0b',
  purple: '#8b5cf6',
};

const theme: Theme = {
  name: 'Vercel Mono',
  id: 'dark',
  colors: {
    autoAccept: rgb(palette.green),
    bashBorder: rgb(palette.ink),
    claude: rgb(palette.ink),
    claudeShimmer: lighten(palette.inkSoft, 0.35),
    claudeBlue_FOR_SYSTEM_SPINNER: rgb(palette.blue),
    claudeBlueShimmer_FOR_SYSTEM_SPINNER: lighten(palette.blue, 0.3),
    permission: rgb(palette.blue),
    permissionShimmer: lighten(palette.blue, 0.2),
    planMode: rgb(palette.inkSoft),
    ide: rgb(palette.blueSoft),
    promptBorder: rgb(palette.border),
    promptBorderShimmer: rgb(palette.borderStrong),
    text: rgb(palette.text),
    inverseText: rgb(palette.base),
    inactive: rgb(palette.textDim),
    subtle: mix(palette.base, palette.inkSoft, 0.08),
    suggestion: rgb(palette.blueSoft),
    remember: rgb(palette.ink),
    background: rgb(palette.base),
    success: rgb(palette.green),
    error: rgb(palette.red),
    warning: rgb(palette.orange),
    warningShimmer: lighten(palette.orange, 0.28),
    ...buildDiffPalette(),
    red_FOR_SUBAGENTS_ONLY: rgb(palette.red),
    blue_FOR_SUBAGENTS_ONLY: rgb(palette.blue),
    green_FOR_SUBAGENTS_ONLY: rgb(palette.green),
    yellow_FOR_SUBAGENTS_ONLY: rgb(palette.orange),
    purple_FOR_SUBAGENTS_ONLY: rgb(palette.purple),
    orange_FOR_SUBAGENTS_ONLY: rgb(palette.orange),
    pink_FOR_SUBAGENTS_ONLY: lighten(palette.purple, 0.32),
    cyan_FOR_SUBAGENTS_ONLY: rgb(palette.blueSoft),
    professionalBlue: rgb(palette.ink),
    rainbow_red: rgb(palette.red),
    rainbow_orange: rgb(palette.orange),
    rainbow_yellow: lighten(palette.orange, 0.18),
    rainbow_green: rgb(palette.green),
    rainbow_blue: rgb(palette.blue),
    rainbow_indigo: rgb(palette.inkSoft),
    rainbow_violet: rgb(palette.purple),
    rainbow_red_shimmer: lighten(palette.red, 0.35),
    rainbow_orange_shimmer: lighten(palette.orange, 0.35),
    rainbow_yellow_shimmer: lighten(palette.orange, 0.3),
    rainbow_green_shimmer: lighten(palette.green, 0.35),
    rainbow_blue_shimmer: lighten(palette.blue, 0.35),
    rainbow_indigo_shimmer: lighten(palette.inkSoft, 0.35),
    rainbow_violet_shimmer: lighten(palette.purple, 0.35),
    clawd_body: rgb(palette.ink),
    clawd_background: rgb(palette.base),
    userMessageBackground: mix('#383838', palette.ink, 0.12),
    bashMessageBackgroundColor: mix('#404040', palette.ink, 0.08),
    memoryBackgroundColor: mix('#383838', palette.blue, 0.1),
    rate_limit_fill: rgb(palette.ink),
    rate_limit_empty: rgb(palette.borderStrong),
  },
};

export const buildVercelTweakccConfig = (): TweakccConfig => ({
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
        'Deploying',
        'Shipping',
        'Routing',
        'Streaming',
        'Caching',
        'Balancing',
        'Scaling',
        'Syncing',
        'Stitching',
        'Finishing',
      ],
    },
    thinkingStyle: {
      updateInterval: 110,
      phases: ['·', '•', '◦', '•'],
      reverseMirror: false,
    },
    userMessageDisplay: {
      format: formatUserMessage(getUserLabel()),
      styling: ['bold'],
      foregroundColor: 'default',
      backgroundColor: 'default',
      borderStyle: 'topBottomDouble',
      borderColor: rgb(palette.ink),
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
