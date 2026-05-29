import type { TweakccSettings } from './types.js';

export const DEFAULT_CLAUDE_MD_ALT_NAMES = [
  'AGENTS.md',
  'GEMINI.md',
  'CRUSH.md',
  'QWEN.md',
  'IFLOW.md',
  'WARP.md',
  'copilot-instructions.md',
];

export const buildBrandSettingsDefaults = (): Pick<
  TweakccSettings,
  | 'toolsets'
  | 'defaultToolset'
  | 'planModeToolset'
  | 'subagentModels'
  | 'inputPatternHighlighters'
  | 'inputPatternHighlightersTestText'
  | 'claudeMdAltNames'
> => ({
  toolsets: [],
  defaultToolset: null,
  planModeToolset: null,
  subagentModels: {
    plan: null,
    explore: null,
    generalPurpose: null,
  },
  inputPatternHighlighters: [],
  inputPatternHighlightersTestText: 'Type test text here to see highlighting',
  claudeMdAltNames: DEFAULT_CLAUDE_MD_ALT_NAMES,
});
