import type { TweakccConfig, Theme } from './types.js';
import { DEFAULT_THEMES } from './defaultThemes.js';
import { buildBrandMiscConfig } from './miscDefaults.js';
import { formatUserMessage, getUserLabel } from './userLabel.js';

/**
 * Z.ai blocked tools - server-injected MCP tools and unavailable builtins
 * These are blocked via toolset to enforce what prompt pack instructs
 */
export const ZAI_BLOCKED_TOOLS = [
  // Server-injected MCP tools (Z.ai injects these, we block them)
  'mcp__4_5v_mcp__analyze_image',
  'mcp__milk_tea_server__claim_milk_tea_coupon',
  'mcp__web_reader__webReader',
  // Builtin tools that should use zai-cli instead
  'WebSearch',
  'WebFetch',
];

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
  base: '#1b1d1f',
  surface: '#25272b',
  panel: '#282a30',
  border: '#353842',
  borderStrong: '#484a58',
  text: '#e8e8e8',
  textMuted: '#c3c4cc',
  textDim: '#8d8e99',
  gold: '#ffd373',
  goldSoft: '#ffdc8f',
  goldDeep: '#b2892e',
  blue: '#0080ff',
  blueSoft: '#66b3ff',
  blueDeep: '#134cff',
  green: '#37d995',
  red: '#fb2c36',
  orange: '#ff8e42',
  purple: '#9c8bff',
};

const theme: Theme = {
  name: 'Z.ai Carbon',
  id: 'zai-carbon',
  colors: {
    autoAccept: rgb(palette.green),
    bashBorder: rgb(palette.gold),
    claude: rgb(palette.gold),
    claudeShimmer: rgb(palette.goldSoft),
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
    remember: rgb(palette.gold),
    background: rgb(palette.base),
    success: rgb(palette.green),
    error: rgb(palette.red),
    warning: rgb(palette.orange),
    warningShimmer: rgb(palette.goldSoft),
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
    yellow_FOR_SUBAGENTS_ONLY: rgb(palette.gold),
    purple_FOR_SUBAGENTS_ONLY: rgb(palette.purple),
    orange_FOR_SUBAGENTS_ONLY: rgb(palette.orange),
    pink_FOR_SUBAGENTS_ONLY: rgb(palette.goldSoft),
    cyan_FOR_SUBAGENTS_ONLY: rgb(palette.blueSoft),
    professionalBlue: rgb(palette.blueSoft),
    rainbow_red: rgb(palette.red),
    rainbow_orange: rgb(palette.orange),
    rainbow_yellow: rgb(palette.gold),
    rainbow_green: rgb(palette.green),
    rainbow_blue: rgb(palette.blue),
    rainbow_indigo: rgb(palette.blueDeep),
    rainbow_violet: rgb(palette.purple),
    rainbow_red_shimmer: lighten(palette.red, 0.35),
    rainbow_orange_shimmer: lighten(palette.orange, 0.35),
    rainbow_yellow_shimmer: lighten(palette.gold, 0.25),
    rainbow_green_shimmer: lighten(palette.green, 0.35),
    rainbow_blue_shimmer: lighten(palette.blue, 0.35),
    rainbow_indigo_shimmer: lighten(palette.blueDeep, 0.35),
    rainbow_violet_shimmer: lighten(palette.purple, 0.35),
    clawd_body: rgb(palette.gold),
    clawd_background: rgb(palette.base),
    userMessageBackground: rgb(palette.panel),
    bashMessageBackgroundColor: rgb(palette.surface),
    memoryBackgroundColor: rgb(palette.panel),
    rate_limit_fill: rgb(palette.gold),
    rate_limit_empty: rgb(palette.borderStrong),
  },
};

export const buildZaiTweakccConfig = (): TweakccConfig => ({
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
        'Calibrating',
        'Indexing',
        'Synthesizing',
        'Optimizing',
        'Routing',
        'Vectorizing',
        'Mapping',
        'Compiling',
        'Refining',
        'Auditing',
        'Aligning',
        'Balancing',
        'Forecasting',
        'Resolving',
        'Validating',
        'Benchmarking',
        'Assembling',
        'Delivering',
      ],
    },
    thinkingStyle: {
      updateInterval: 110,
      phases: ['.', 'o', 'O', '0', 'O', 'o'],
      reverseMirror: false,
    },
    userMessageDisplay: {
      format: formatUserMessage(getUserLabel()),
      styling: ['bold'],
      foregroundColor: 'default',
      backgroundColor: 'default',
      borderStyle: 'topBottomBold',
      borderColor: rgb(palette.gold),
      paddingX: 1,
      paddingY: 0,
      fitBoxToContent: true,
    },
    inputBox: {
      removeBorder: true,
    },
    misc: buildBrandMiscConfig(),
    toolsets: [
      {
        name: 'zai',
        allowedTools: '*',
        blockedTools: ZAI_BLOCKED_TOOLS,
      },
    ],
    defaultToolset: 'zai',
    planModeToolset: 'zai',
    claudeMdAltNames: null,
  },
});
