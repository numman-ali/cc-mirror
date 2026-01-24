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

const palette = {
  base: '#eef6ff',
  surface: '#f7fbff',
  panel: '#e2eeff',
  border: '#c6dbff',
  borderStrong: '#9fbfff',
  text: '#0e1a2b',
  textMuted: '#2b3a52',
  textDim: '#5a6b85',
  blue: '#3b82f6',
  blueBright: '#60a5fa',
  blueDeep: '#1d4ed8',
  pink: '#ec4899',
  green: '#2f9b6d',
  red: '#d04b5a',
  orange: '#d28a3c',
  purple: '#6b5bd6',
};

const theme: Theme = {
  name: 'NanoGPT Neon',
  id: 'nanogpt-neon',
  colors: {
    autoAccept: rgb(palette.green),
    bashBorder: rgb(palette.blue),
    claude: rgb(palette.blueDeep),
    claudeShimmer: lighten(palette.blue, 0.35),
    claudeBlue_FOR_SYSTEM_SPINNER: rgb(palette.blue),
    claudeBlueShimmer_FOR_SYSTEM_SPINNER: lighten(palette.blueBright, 0.2),
    permission: rgb(palette.pink),
    permissionShimmer: lighten(palette.pink, 0.25),
    planMode: rgb(palette.blueDeep),
    ide: rgb(palette.blueBright),
    promptBorder: rgb(palette.border),
    promptBorderShimmer: rgb(palette.borderStrong),
    text: rgb(palette.text),
    inverseText: rgb(palette.base),
    inactive: rgb(palette.textDim),
    subtle: mix(palette.base, palette.blueBright, 0.12),
    suggestion: rgb(palette.blueBright),
    remember: rgb(palette.blueDeep),
    background: rgb(palette.base),
    success: rgb(palette.green),
    error: rgb(palette.red),
    warning: rgb(palette.orange),
    warningShimmer: lighten(palette.orange, 0.28),
    diffAdded: mix(palette.base, palette.green, 0.2),
    diffRemoved: mix(palette.base, palette.red, 0.2),
    diffAddedDimmed: mix(palette.base, palette.green, 0.12),
    diffRemovedDimmed: mix(palette.base, palette.red, 0.12),
    diffAddedWord: mix(palette.base, palette.green, 0.42),
    diffRemovedWord: mix(palette.base, palette.red, 0.42),
    diffAddedWordDimmed: mix(palette.base, palette.green, 0.28),
    diffRemovedWordDimmed: mix(palette.base, palette.red, 0.28),
    red_FOR_SUBAGENTS_ONLY: rgb(palette.red),
    blue_FOR_SUBAGENTS_ONLY: rgb(palette.blueDeep),
    green_FOR_SUBAGENTS_ONLY: rgb(palette.green),
    yellow_FOR_SUBAGENTS_ONLY: rgb(palette.orange),
    purple_FOR_SUBAGENTS_ONLY: rgb(palette.purple),
    orange_FOR_SUBAGENTS_ONLY: rgb(palette.orange),
    pink_FOR_SUBAGENTS_ONLY: lighten(palette.pink, 0.32),
    cyan_FOR_SUBAGENTS_ONLY: rgb(palette.blueBright),
    professionalBlue: rgb(palette.blue),
    rainbow_red: rgb(palette.red),
    rainbow_orange: rgb(palette.orange),
    rainbow_yellow: lighten(palette.orange, 0.18),
    rainbow_green: rgb(palette.green),
    rainbow_blue: rgb(palette.blueBright),
    rainbow_indigo: rgb(palette.blueDeep),
    rainbow_violet: rgb(palette.purple),
    rainbow_red_shimmer: lighten(palette.red, 0.35),
    rainbow_orange_shimmer: lighten(palette.orange, 0.35),
    rainbow_yellow_shimmer: lighten(palette.orange, 0.3),
    rainbow_green_shimmer: lighten(palette.green, 0.35),
    rainbow_blue_shimmer: lighten(palette.blueBright, 0.35),
    rainbow_indigo_shimmer: lighten(palette.blueDeep, 0.35),
    rainbow_violet_shimmer: lighten(palette.purple, 0.35),
    clawd_body: rgb(palette.blueDeep),
    clawd_background: rgb(palette.base),
    userMessageBackground: rgb(palette.panel),
    bashMessageBackgroundColor: rgb(palette.surface),
    memoryBackgroundColor: mix(palette.panel, palette.blueBright, 0.12),
    rate_limit_fill: rgb(palette.blue),
    rate_limit_empty: rgb(palette.borderStrong),
  },
};

export const buildNanoGPTTweakccConfig = (): TweakccConfig => ({
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
        'Nano-tuning',
        'Vectorizing',
        'Synthesizing',
        'Batching',
        'Optimizing',
        'Indexing',
        'Sampling',
        'Compressing',
        'Shaping',
        'Refining',
      ],
    },
    thinkingStyle: {
      updateInterval: 118,
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
        name: 'nanogpt',
        allowedTools: '*',
      },
    ],
    defaultToolset: 'nanogpt',
    planModeToolset: 'nanogpt',
  },
});
