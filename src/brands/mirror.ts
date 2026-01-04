/**
 * Mirror Claude Brand Preset
 *
 * A reflective, silver/chrome aesthetic for pure Claude Code experience.
 * Theme concept: polished mirror surface with electric accents.
 */

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

// Mirror palette: silver/chrome with electric blue accents
const palette = {
  // Base surfaces - near-black with metallic sheen
  base: '#0d0f12',
  surface: '#14161a',
  panel: '#1a1d22',
  elevated: '#22262d',
  // Borders - subtle silver
  border: '#3a3f48',
  borderStrong: '#4a5058',
  borderGlow: '#6a7078',
  // Text
  text: '#e8eaed',
  textMuted: '#b0b5bc',
  textDim: '#7a8088',
  // Primary: Silver/Chrome
  silver: '#c0c0c0',
  chrome: '#a0a0a0',
  platinum: '#e5e4e2',
  // Accent: Electric blue
  electric: '#00d4ff',
  electricSoft: '#4de1ff',
  electricDeep: '#00a3cc',
  // Secondary: Deep purple
  purple: '#6b5b95',
  purpleSoft: '#8a7ab4',
  // Semantic
  green: '#4ade80',
  red: '#f87171',
  orange: '#fb923c',
  cyan: '#22d3ee',
};

const theme: Theme = {
  name: 'Mirror Claude',
  id: 'mirror-claude',
  colors: {
    autoAccept: rgb(palette.green),
    bashBorder: rgb(palette.electric),
    claude: rgb(palette.silver),
    claudeShimmer: rgb(palette.platinum),
    claudeBlue_FOR_SYSTEM_SPINNER: rgb(palette.electric),
    claudeBlueShimmer_FOR_SYSTEM_SPINNER: lighten(palette.electric, 0.2),
    permission: rgb(palette.electricSoft),
    permissionShimmer: lighten(palette.electricSoft, 0.25),
    planMode: rgb(palette.purple),
    ide: rgb(palette.cyan),
    promptBorder: rgb(palette.border),
    promptBorderShimmer: rgb(palette.borderGlow),
    text: rgb(palette.text),
    inverseText: rgb(palette.base),
    inactive: rgb(palette.textDim),
    subtle: mix(palette.base, palette.chrome, 0.08),
    suggestion: rgb(palette.electricSoft),
    remember: rgb(palette.purple),
    background: rgb(palette.base),
    success: rgb(palette.green),
    error: rgb(palette.red),
    warning: rgb(palette.orange),
    warningShimmer: lighten(palette.orange, 0.28),
    diffAdded: mix(palette.base, palette.green, 0.15),
    diffRemoved: mix(palette.base, palette.red, 0.15),
    diffAddedDimmed: mix(palette.base, palette.green, 0.08),
    diffRemovedDimmed: mix(palette.base, palette.red, 0.08),
    diffAddedWord: mix(palette.base, palette.green, 0.32),
    diffRemovedWord: mix(palette.base, palette.red, 0.32),
    diffAddedWordDimmed: mix(palette.base, palette.green, 0.18),
    diffRemovedWordDimmed: mix(palette.base, palette.red, 0.18),
    red_FOR_SUBAGENTS_ONLY: rgb(palette.red),
    blue_FOR_SUBAGENTS_ONLY: rgb(palette.electric),
    green_FOR_SUBAGENTS_ONLY: rgb(palette.green),
    yellow_FOR_SUBAGENTS_ONLY: rgb(palette.orange),
    purple_FOR_SUBAGENTS_ONLY: rgb(palette.purple),
    orange_FOR_SUBAGENTS_ONLY: rgb(palette.orange),
    pink_FOR_SUBAGENTS_ONLY: lighten(palette.purple, 0.32),
    cyan_FOR_SUBAGENTS_ONLY: rgb(palette.cyan),
    professionalBlue: rgb(palette.electric),
    rainbow_red: rgb(palette.red),
    rainbow_orange: rgb(palette.orange),
    rainbow_yellow: lighten(palette.orange, 0.18),
    rainbow_green: rgb(palette.green),
    rainbow_blue: rgb(palette.electricSoft),
    rainbow_indigo: rgb(palette.electricDeep),
    rainbow_violet: rgb(palette.purple),
    rainbow_red_shimmer: lighten(palette.red, 0.35),
    rainbow_orange_shimmer: lighten(palette.orange, 0.35),
    rainbow_yellow_shimmer: lighten(palette.orange, 0.3),
    rainbow_green_shimmer: lighten(palette.green, 0.35),
    rainbow_blue_shimmer: lighten(palette.electricSoft, 0.35),
    rainbow_indigo_shimmer: lighten(palette.electricDeep, 0.35),
    rainbow_violet_shimmer: lighten(palette.purple, 0.35),
    clawd_body: rgb(palette.silver),
    clawd_background: rgb(palette.base),
    userMessageBackground: rgb(palette.panel),
    bashMessageBackgroundColor: rgb(palette.surface),
    memoryBackgroundColor: mix(palette.panel, palette.purple, 0.08),
    rate_limit_fill: rgb(palette.electric),
    rate_limit_empty: rgb(palette.borderStrong),
  },
};

export const buildMirrorTweakccConfig = (): TweakccConfig => ({
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
        'Reflecting',
        'Refracting',
        'Projecting',
        'Mirroring',
        'Amplifying',
        'Focusing',
        'Polishing',
        'Crystallizing',
        'Calibrating',
        'Synthesizing',
        'Resolving',
        'Composing',
        'Rendering',
        'Finalizing',
      ],
    },
    thinkingStyle: {
      updateInterval: 100,
      phases: ['◇', '◆', '◇', '◈'],
      reverseMirror: true,
    },
    userMessageDisplay: {
      format: formatUserMessage(getUserLabel()),
      styling: ['bold'],
      foregroundColor: rgb(palette.platinum),
      backgroundColor: rgb(palette.panel),
      borderStyle: 'topBottomDouble',
      borderColor: rgb(palette.silver),
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
        name: 'mirror',
        allowedTools: '*',
      },
    ],
    defaultToolset: 'mirror',
    planModeToolset: 'mirror',
  },
});
