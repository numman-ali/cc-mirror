import type { TweakccConfig, Theme } from './types.js';
import { DEFAULT_THEMES } from './defaultThemes.js';
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

// Vercel's brand colors: black, white, and accent colors
const palette = {
  // Base colors - Vercel's minimal dark aesthetic
  base: '#000000',
  surface: '#111111',
  panel: '#1a1a1a',
  border: '#333333',
  borderStrong: '#444444',
  text: '#ededed',
  textMuted: '#a1a1a1',
  textDim: '#666666',
  // Vercel accent colors
  white: '#ffffff',
  blue: '#0070f3', // Vercel's primary blue
  cyan: '#79ffe1', // Vercel's success/accent cyan
  purple: '#7928ca', // Vercel's purple
  pink: '#ff0080', // Vercel's pink/magenta
  orange: '#f5a623',
  red: '#ee0000',
  green: '#0070f3',
  yellow: '#f5a623',
};

const theme: Theme = {
  name: 'Vercel AI Gateway',
  id: 'vercel-ai-gateway',
  colors: {
    autoAccept: rgb(palette.cyan),
    bashBorder: rgb(palette.border),
    claude: rgb(palette.white),
    claudeShimmer: rgb(palette.textMuted),
    claudeBlue_FOR_SYSTEM_SPINNER: rgb(palette.blue),
    claudeBlueShimmer_FOR_SYSTEM_SPINNER: lighten(palette.blue, 0.3),
    permission: rgb(palette.cyan),
    permissionShimmer: lighten(palette.cyan, 0.25),
    planMode: rgb(palette.purple),
    ide: rgb(palette.textMuted),
    promptBorder: rgb(palette.border),
    promptBorderShimmer: rgb(palette.borderStrong),
    text: rgb(palette.text),
    inverseText: rgb(palette.base),
    inactive: rgb(palette.textDim),
    subtle: mix(palette.base, palette.border, 0.3),
    suggestion: rgb(palette.textMuted),
    remember: rgb(palette.blue),
    background: rgb(palette.base),
    success: rgb(palette.cyan),
    error: rgb(palette.red),
    warning: rgb(palette.orange),
    warningShimmer: lighten(palette.orange, 0.28),
    diffAdded: mix(palette.base, palette.cyan, 0.15),
    diffRemoved: mix(palette.base, palette.red, 0.15),
    diffAddedDimmed: mix(palette.base, palette.cyan, 0.08),
    diffRemovedDimmed: mix(palette.base, palette.red, 0.08),
    diffAddedWord: mix(palette.base, palette.cyan, 0.35),
    diffRemovedWord: mix(palette.base, palette.red, 0.35),
    diffAddedWordDimmed: mix(palette.base, palette.cyan, 0.2),
    diffRemovedWordDimmed: mix(palette.base, palette.red, 0.2),
    red_FOR_SUBAGENTS_ONLY: rgb(palette.red),
    blue_FOR_SUBAGENTS_ONLY: rgb(palette.blue),
    green_FOR_SUBAGENTS_ONLY: rgb(palette.cyan),
    yellow_FOR_SUBAGENTS_ONLY: rgb(palette.yellow),
    purple_FOR_SUBAGENTS_ONLY: rgb(palette.purple),
    orange_FOR_SUBAGENTS_ONLY: rgb(palette.orange),
    pink_FOR_SUBAGENTS_ONLY: rgb(palette.pink),
    cyan_FOR_SUBAGENTS_ONLY: rgb(palette.cyan),
    professionalBlue: rgb(palette.blue),
    rainbow_red: rgb(palette.red),
    rainbow_orange: rgb(palette.orange),
    rainbow_yellow: rgb(palette.yellow),
    rainbow_green: rgb(palette.cyan),
    rainbow_blue: rgb(palette.blue),
    rainbow_indigo: rgb(palette.purple),
    rainbow_violet: rgb(palette.pink),
    rainbow_red_shimmer: lighten(palette.red, 0.35),
    rainbow_orange_shimmer: lighten(palette.orange, 0.35),
    rainbow_yellow_shimmer: lighten(palette.yellow, 0.3),
    rainbow_green_shimmer: lighten(palette.cyan, 0.35),
    rainbow_blue_shimmer: lighten(palette.blue, 0.35),
    rainbow_indigo_shimmer: lighten(palette.purple, 0.35),
    rainbow_violet_shimmer: lighten(palette.pink, 0.35),
    clawd_body: rgb(palette.white),
    clawd_background: rgb(palette.base),
    userMessageBackground: rgb(palette.surface),
    bashMessageBackgroundColor: rgb(palette.panel),
    memoryBackgroundColor: mix(palette.surface, palette.blue, 0.08),
    rate_limit_fill: rgb(palette.blue),
    rate_limit_empty: rgb(palette.border),
  },
};

export const buildVercelTweakccConfig = (): TweakccConfig => ({
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
        'Deploying',
        'Building',
        'Routing',
        'Streaming',
        'Proxying',
        'Inferring',
        'Optimizing',
        'Caching',
        'Scaling',
        'Balancing',
        'Resolving',
        'Connecting',
        'Processing',
        'Analyzing',
      ],
    },
    thinkingStyle: {
      updateInterval: 120,
      phases: ['_', '-', '=', '-'],
      reverseMirror: false,
    },
    userMessageDisplay: {
      format: formatUserMessage(getUserLabel()),
      styling: ['bold'],
      foregroundColor: 'default',
      backgroundColor: 'default',
      borderStyle: 'topBottomSingle',
      borderColor: rgb(palette.border),
      paddingX: 1,
      paddingY: 0,
      fitBoxToContent: true,
    },
    inputBox: {
      removeBorder: true,
    },
    misc: {
      showTweakccVersion: false,
      showPatchesApplied: false,
      expandThinkingBlocks: true,
      enableConversationTitle: true,
      hideStartupBanner: true,
      hideCtrlGToEditPrompt: true,
      hideStartupClawd: true,
      increaseFileReadLimit: true,
    },
    toolsets: [
      {
        name: 'vercel',
        allowedTools: '*',
      },
    ],
    defaultToolset: 'vercel',
    planModeToolset: 'vercel',
  },
});
