/**
 * Amazon Bedrock Brand Preset
 *
 * AWS-themed aesthetic with orange/amber colors and dark navy accents.
 * Theme concept: cloud infrastructure with warm AWS orange highlights.
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

// AWS palette: Orange primary, dark navy surfaces
const palette = {
  // Base surfaces - AWS dark navy
  base: '#0f1b2a',
  surface: '#172133',
  panel: '#1e2a3d',
  elevated: '#273548',
  // Borders
  border: '#3a4a5e',
  borderStrong: '#4a5a6e',
  borderGlow: '#5a6a7e',
  // Text
  text: '#f0f4f8',
  textMuted: '#c0c8d2',
  textDim: '#8090a0',
  // Primary: AWS Orange
  orange: '#ff9900',
  orangeSoft: '#ffb84d',
  orangeDeep: '#cc7a00',
  // Secondary: AWS Teal/Cyan
  teal: '#00a1c9',
  tealSoft: '#4dc3dd',
  tealDeep: '#007d9c',
  // Accent: Warm amber
  amber: '#ffc107',
  amberSoft: '#ffd54f',
  // Semantic
  green: '#2ecc71',
  red: '#e74c3c',
  purple: '#9b59b6',
};

const theme: Theme = {
  name: 'Bedrock AWS',
  id: 'bedrock-aws',
  colors: {
    autoAccept: rgb(palette.green),
    bashBorder: rgb(palette.orange),
    claude: rgb(palette.orange),
    claudeShimmer: rgb(palette.orangeSoft),
    claudeBlue_FOR_SYSTEM_SPINNER: rgb(palette.teal),
    claudeBlueShimmer_FOR_SYSTEM_SPINNER: lighten(palette.teal, 0.2),
    permission: rgb(palette.tealSoft),
    permissionShimmer: lighten(palette.tealSoft, 0.25),
    planMode: rgb(palette.teal),
    ide: rgb(palette.tealSoft),
    promptBorder: rgb(palette.border),
    promptBorderShimmer: rgb(palette.borderGlow),
    text: rgb(palette.text),
    inverseText: rgb(palette.base),
    inactive: rgb(palette.textDim),
    subtle: mix(palette.base, palette.orange, 0.08),
    suggestion: rgb(palette.orangeSoft),
    remember: rgb(palette.amber),
    background: rgb(palette.base),
    success: rgb(palette.green),
    error: rgb(palette.red),
    warning: rgb(palette.amber),
    warningShimmer: lighten(palette.amber, 0.28),
    diffAdded: mix(palette.base, palette.green, 0.15),
    diffRemoved: mix(palette.base, palette.red, 0.15),
    diffAddedDimmed: mix(palette.base, palette.green, 0.08),
    diffRemovedDimmed: mix(palette.base, palette.red, 0.08),
    diffAddedWord: mix(palette.base, palette.green, 0.32),
    diffRemovedWord: mix(palette.base, palette.red, 0.32),
    diffAddedWordDimmed: mix(palette.base, palette.green, 0.18),
    diffRemovedWordDimmed: mix(palette.base, palette.red, 0.18),
    red_FOR_SUBAGENTS_ONLY: rgb(palette.red),
    blue_FOR_SUBAGENTS_ONLY: rgb(palette.teal),
    green_FOR_SUBAGENTS_ONLY: rgb(palette.green),
    yellow_FOR_SUBAGENTS_ONLY: rgb(palette.amber),
    purple_FOR_SUBAGENTS_ONLY: rgb(palette.purple),
    orange_FOR_SUBAGENTS_ONLY: rgb(palette.orange),
    pink_FOR_SUBAGENTS_ONLY: lighten(palette.purple, 0.32),
    cyan_FOR_SUBAGENTS_ONLY: rgb(palette.tealSoft),
    professionalBlue: rgb(palette.teal),
    rainbow_red: rgb(palette.red),
    rainbow_orange: rgb(palette.orange),
    rainbow_yellow: rgb(palette.amber),
    rainbow_green: rgb(palette.green),
    rainbow_blue: rgb(palette.tealSoft),
    rainbow_indigo: rgb(palette.tealDeep),
    rainbow_violet: rgb(palette.purple),
    rainbow_red_shimmer: lighten(palette.red, 0.35),
    rainbow_orange_shimmer: lighten(palette.orange, 0.35),
    rainbow_yellow_shimmer: lighten(palette.amber, 0.3),
    rainbow_green_shimmer: lighten(palette.green, 0.35),
    rainbow_blue_shimmer: lighten(palette.tealSoft, 0.35),
    rainbow_indigo_shimmer: lighten(palette.tealDeep, 0.35),
    rainbow_violet_shimmer: lighten(palette.purple, 0.35),
    clawd_body: rgb(palette.orange),
    clawd_background: rgb(palette.base),
    userMessageBackground: rgb(palette.panel),
    bashMessageBackgroundColor: rgb(palette.surface),
    memoryBackgroundColor: mix(palette.panel, palette.teal, 0.08),
    rate_limit_fill: rgb(palette.orange),
    rate_limit_empty: rgb(palette.borderStrong),
  },
};

export const buildBedrockTweakccConfig = (): TweakccConfig => ({
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
        'Invoking',
        'Provisioning',
        'Streaming',
        'Scaling',
        'Routing',
        'Deploying',
        'Orchestrating',
        'Processing',
        'Resolving',
        'Synthesizing',
        'Optimizing',
        'Calibrating',
        'Inferencing',
        'Computing',
      ],
    },
    thinkingStyle: {
      updateInterval: 100,
      phases: ['▸', '▹', '▸', '▹'],
      reverseMirror: false,
    },
    userMessageDisplay: {
      format: formatUserMessage(getUserLabel()),
      styling: ['bold'],
      foregroundColor: rgb(palette.text),
      backgroundColor: rgb(palette.panel),
      borderStyle: 'topBottomBold',
      borderColor: rgb(palette.orange),
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
        name: 'bedrock',
        allowedTools: '*',
      },
    ],
    defaultToolset: 'bedrock',
    planModeToolset: 'bedrock',
  },
});
