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

// GatewayZ palette - violet/purple gateway theme with tech accents
const palette = {
  base: '#1a1625',
  surface: '#221d2e',
  panel: '#2a2438',
  border: '#3d3650',
  borderStrong: '#524a68',
  text: '#e8e6ec',
  textMuted: '#c4c0cc',
  textDim: '#8a8494',
  // Primary violet/purple gateway colors
  violet: '#8b5cf6',
  violetSoft: '#a78bfa',
  violetDeep: '#6d28d9',
  // Accent colors
  cyan: '#22d3ee',
  cyanSoft: '#67e8f9',
  green: '#34d399',
  red: '#f87171',
  orange: '#fb923c',
  pink: '#f472b6',
};

const theme: Theme = {
  name: 'GatewayZ Portal',
  id: 'gatewayz-portal',
  colors: {
    autoAccept: rgb(palette.green),
    bashBorder: rgb(palette.violet),
    claude: rgb(palette.violet),
    claudeShimmer: rgb(palette.violetSoft),
    claudeBlue_FOR_SYSTEM_SPINNER: rgb(palette.cyan),
    claudeBlueShimmer_FOR_SYSTEM_SPINNER: rgb(palette.cyanSoft),
    permission: rgb(palette.cyan),
    permissionShimmer: rgb(palette.cyanSoft),
    planMode: rgb(palette.green),
    ide: rgb(palette.cyanSoft),
    promptBorder: rgb(palette.border),
    promptBorderShimmer: rgb(palette.borderStrong),
    text: rgb(palette.text),
    inverseText: rgb(palette.base),
    inactive: rgb(palette.textDim),
    subtle: rgb(palette.border),
    suggestion: rgb(palette.cyanSoft),
    remember: rgb(palette.violet),
    background: rgb(palette.base),
    success: rgb(palette.green),
    error: rgb(palette.red),
    warning: rgb(palette.orange),
    warningShimmer: lighten(palette.orange, 0.25),
    diffAdded: mix(palette.base, palette.green, 0.18),
    diffRemoved: mix(palette.base, palette.red, 0.18),
    diffAddedDimmed: mix(palette.base, palette.green, 0.1),
    diffRemovedDimmed: mix(palette.base, palette.red, 0.1),
    diffAddedWord: mix(palette.base, palette.green, 0.45),
    diffRemovedWord: mix(palette.base, palette.red, 0.45),
    diffAddedWordDimmed: mix(palette.base, palette.green, 0.3),
    diffRemovedWordDimmed: mix(palette.base, palette.red, 0.3),
    red_FOR_SUBAGENTS_ONLY: rgb(palette.red),
    blue_FOR_SUBAGENTS_ONLY: rgb(palette.violetDeep),
    green_FOR_SUBAGENTS_ONLY: rgb(palette.green),
    yellow_FOR_SUBAGENTS_ONLY: rgb(palette.orange),
    purple_FOR_SUBAGENTS_ONLY: rgb(palette.violet),
    orange_FOR_SUBAGENTS_ONLY: rgb(palette.orange),
    pink_FOR_SUBAGENTS_ONLY: rgb(palette.pink),
    cyan_FOR_SUBAGENTS_ONLY: rgb(palette.cyan),
    professionalBlue: rgb(palette.cyanSoft),
    rainbow_red: rgb(palette.red),
    rainbow_orange: rgb(palette.orange),
    rainbow_yellow: lighten(palette.orange, 0.2),
    rainbow_green: rgb(palette.green),
    rainbow_blue: rgb(palette.cyan),
    rainbow_indigo: rgb(palette.violetDeep),
    rainbow_violet: rgb(palette.violet),
    rainbow_red_shimmer: lighten(palette.red, 0.35),
    rainbow_orange_shimmer: lighten(palette.orange, 0.35),
    rainbow_yellow_shimmer: lighten(palette.orange, 0.4),
    rainbow_green_shimmer: lighten(palette.green, 0.35),
    rainbow_blue_shimmer: lighten(palette.cyan, 0.35),
    rainbow_indigo_shimmer: lighten(palette.violetDeep, 0.35),
    rainbow_violet_shimmer: lighten(palette.violet, 0.35),
    clawd_body: rgb(palette.violet),
    clawd_background: rgb(palette.base),
    userMessageBackground: rgb(palette.panel),
    bashMessageBackgroundColor: rgb(palette.surface),
    memoryBackgroundColor: rgb(palette.panel),
    rate_limit_fill: rgb(palette.violet),
    rate_limit_empty: rgb(palette.borderStrong),
  },
};

export const buildGatewayZTweakccConfig = (): TweakccConfig => ({
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
        'Tunneling',
        'Bridging',
        'Connecting',
        'Relaying',
        'Forwarding',
        'Proxying',
        'Streaming',
        'Syncing',
        'Processing',
        'Resolving',
        'Mapping',
        'Transferring',
        'Linking',
      ],
    },
    thinkingStyle: {
      updateInterval: 115,
      phases: ['◇', '◈', '◆', '◈'],
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
        name: 'gatewayz',
        allowedTools: '*',
      },
    ],
    defaultToolset: 'gatewayz',
    planModeToolset: 'gatewayz',
  },
});
