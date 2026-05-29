import { buildBrandConfig } from '../brands/index.js';
import { DEFAULT_THEMES } from '../brands/defaultThemes.js';
import { buildBrandMiscConfig } from '../brands/miscDefaults.js';
import { buildBrandSettingsDefaults } from '../brands/settingsDefaults.js';
import type { TweakccConfig } from '../brands/types.js';
import { PROMPT_PACK_TARGETS } from './prompt-pack/targets.js';

export type TweakccProfileOptions = {
  providerKey?: string | null;
  promptPackEnabled?: boolean;
};

const BRAND_PATCH_IDS = [
  'thinking-verbs',
  'thinker-symbol-chars',
  'thinker-symbol-speed',
  'thinker-symbol-width',
  'thinker-symbol-mirror',
  'input-box-border',
];

const MANAGED_SAFE_PATCH_IDS = [
  'thinking-block-styling',
  'statusline-update-throttle',
  'patches-applied-indication',
  'table-format',
  'thinking-visibility',
  'hide-startup-banner',
  'hide-ctrl-g-to-edit',
  'hide-startup-clawd',
  'suppress-rate-limit-options',
  'token-count-rounding',
  'agents-md',
  'suppress-native-installer-warning',
  'filter-scroll-escape-sequences',
  'allow-custom-agent-models',
  'worktree-mode',
  'mcp-non-blocking',
  'mcp-batch-size',
  'input-pattern-highlighters',
  'conversation-title',
];

const MIRROR_ONLY_PATCH_IDS = ['show-more-items-in-select-menus'];

const PROMPT_PACK_PATCH_IDS = PROMPT_PACK_TARGETS.map((target) => target.filename.replace(/\.md$/, ''));

const unique = (values: string[]) => [...new Set(values)];

const modelCustomizationsEnabled = (_brandKey?: string | null, _providerKey?: string | null) => false;

const buildFallbackConfig = (providerKey?: string | null): TweakccConfig => ({
  ccVersion: '',
  ccInstallationPath: null,
  lastModified: new Date().toISOString(),
  changesApplied: false,
  hidePiebaldAnnouncement: true,
  settings: {
    themes: DEFAULT_THEMES,
    thinkingVerbs: {
      format: '{}... ',
      verbs: ['Thinking'],
    },
    thinkingStyle: {
      updateInterval: 120,
      phases: ['.', 'o', 'O', 'o'],
      reverseMirror: false,
    },
    userMessageDisplay: {
      format: ' > {} ',
      styling: [],
      foregroundColor: 'default',
      backgroundColor: null,
      borderStyle: 'none',
      borderColor: 'rgb(255,255,255)',
      paddingX: 0,
      paddingY: 0,
      fitBoxToContent: false,
    },
    inputBox: {
      removeBorder: false,
    },
    misc: buildBrandMiscConfig({ enableModelCustomizations: modelCustomizationsEnabled(null, providerKey) }),
    ...buildBrandSettingsDefaults(),
  },
});

export const buildManagedTweakccConfig = (
  brandKey?: string | null,
  options: TweakccProfileOptions = {}
): TweakccConfig => {
  const config = brandKey ? buildBrandConfig(brandKey) : buildFallbackConfig(options.providerKey);
  const enableModelCustomizations = modelCustomizationsEnabled(brandKey, options.providerKey);
  return {
    ...config,
    settings: {
      ...config.settings,
      misc: {
        ...config.settings.misc,
        enableModelCustomizations,
      },
      ...buildBrandSettingsDefaults(),
      toolsets: config.settings.toolsets,
      defaultToolset: config.settings.defaultToolset,
      planModeToolset: config.settings.planModeToolset,
    },
  };
};

export const getManagedTweakccPatchIds = (brandKey?: string | null, options: TweakccProfileOptions = {}): string[] => {
  const patchIds = [
    ...MANAGED_SAFE_PATCH_IDS,
    ...(options.providerKey === 'mirror' || brandKey === 'mirror' ? MIRROR_ONLY_PATCH_IDS : []),
    ...(brandKey ? BRAND_PATCH_IDS : []),
    ...(options.promptPackEnabled ? PROMPT_PACK_PATCH_IDS : []),
  ];
  return unique(patchIds);
};
