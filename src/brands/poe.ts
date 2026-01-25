import type { TweakccConfig, Theme } from './types.js';
import { DEFAULT_THEMES } from './defaultThemes.js';
import { formatUserMessage, getUserLabel } from './userLabel.js';

/**
 * Poe blocked tools - currently none
 * Poe provides a clean Claude API interface without restrictions
 */
export const POE_BLOCKED_TOOLS: string[] = [];

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
  base: '#0f0a1a',
  surface: '#1a1428',
  panel: '#221c33',
  border: '#3a2f52',
  borderStrong: '#4d3f6b',
  text: '#ede9f5',
  textMuted: '#d1c4e3',
  textDim: '#9b88bc',
  violet: '#8b5cf6',
  violetSoft: '#a78bfa',
  violetDeep: '#6d28d9',
  blue: '#7c3aed',
  blueSoft: '#a78bfa',
  blueDeep: '#5b21b6',
  green: '#34d399',
  red: '#f43f5e',
  orange: '#fb923c',
  purple: '#c084fc',
};

const theme: Theme = {
  name: 'Poe Violet',
  id: 'poe-violet',
  colors: {
    autoAccept: rgb(palette.purple),
    bashBorder: rgb(palette.violet),
    claude: rgb(palette.violet),
    claudeShimmer: rgb(palette.violetSoft),
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
    remember: rgb(palette.violet),
    background: rgb(palette.base),
    success: rgb(palette.green),
    error: rgb(palette.red),
    warning: rgb(palette.orange),
    warningShimmer: rgb(palette.violetSoft),
    diffAdded: mix(palette.base, palette.green, 0.18),
    diffRemoved: mix(palette.base, palette.red, 0.18),
    diffAddedDimmed: mix(palette.base, palette.green, 0.1),
    diffRemovedDimmed: mix(palette.base, palette.red, 0.1),
    diffAddedWord: mix(palette.base, palette.green, 0.45),
    diffRemovedWord: mix(palette.base, palette.red, 0.45),
    diffAddedWordDimmed: mix(palette.base, palette.green, 0.3),
    diffRemovedWordDimmed: mix(palette.base, palette.red, 0.3),
    red_FOR_SUBAGENTS_ONLY: rgb(palette.red),
    blue_FOR_SUBAGENTS_ONLY: rgb(palette.blueDeep),
    green_FOR_SUBAGENTS_ONLY: rgb(palette.green),
    yellow_FOR_SUBAGENTS_ONLY: rgb(palette.orange),
    purple_FOR_SUBAGENTS_ONLY: rgb(palette.purple),
    orange_FOR_SUBAGENTS_ONLY: rgb(palette.orange),
    pink_FOR_SUBAGENTS_ONLY: rgb(palette.violetSoft),
    cyan_FOR_SUBAGENTS_ONLY: rgb(palette.blueSoft),
    professionalBlue: rgb(palette.blueSoft),
    rainbow_red: rgb(palette.red),
    rainbow_orange: rgb(palette.orange),
    rainbow_yellow: rgb(palette.orange),
    rainbow_green: rgb(palette.green),
    rainbow_blue: rgb(palette.blue),
    rainbow_indigo: rgb(palette.blueDeep),
    rainbow_violet: rgb(palette.purple),
    rainbow_red_shimmer: lighten(palette.red, 0.35),
    rainbow_orange_shimmer: lighten(palette.orange, 0.35),
    rainbow_yellow_shimmer: lighten(palette.orange, 0.25),
    rainbow_green_shimmer: lighten(palette.green, 0.35),
    rainbow_blue_shimmer: lighten(palette.blue, 0.35),
    rainbow_indigo_shimmer: lighten(palette.blueDeep, 0.35),
    rainbow_violet_shimmer: lighten(palette.purple, 0.35),
    clawd_body: rgb(palette.violet),
    clawd_background: rgb(palette.base),
    userMessageBackground: rgb(palette.panel),
    bashMessageBackgroundColor: rgb(palette.surface),
    memoryBackgroundColor: rgb(palette.panel),
    rate_limit_fill: rgb(palette.violet),
    rate_limit_empty: rgb(palette.borderStrong),
  },
};

export const buildPoeTweakccConfig = (): TweakccConfig => ({
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
        'Channeling',
        'Conjuring',
        'Manifesting',
        'Synthesizing',
        'Crystallizing',
        'Transmuting',
        'Distilling',
        'Weaving',
        'Harmonizing',
        'Resonating',
        'Illuminating',
        'Transcending',
        'Converging',
        'Materializing',
        'Orchestrating',
        'Harmonizing',
        'Aligning',
        'Unifying',
      ],
    },
    thinkingStyle: {
      updateInterval: 110,
      phases: ['◇', '◆', '◇', '◆'],
      reverseMirror: false,
    },
    userMessageDisplay: {
      format: formatUserMessage(getUserLabel()),
      styling: ['bold'],
      foregroundColor: 'default',
      backgroundColor: 'default',
      borderStyle: 'topBottomBold',
      borderColor: rgb(palette.violet),
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
        name: 'poe',
        allowedTools: '*',
        blockedTools: POE_BLOCKED_TOOLS,
      },
    ],
    defaultToolset: 'poe',
    planModeToolset: 'poe',
  },
});
