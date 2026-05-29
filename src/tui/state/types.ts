/**
 * TUI State Types
 */

import type { DoctorReportItem, VariantEntry, VariantMeta } from '../../core/types.js';

/**
 * All possible screens in the TUI
 */
export type Screen =
  // Home and exit
  | 'home'
  | 'exit'
  // Quick setup flow
  | 'quick-provider'
  | 'quick-intro'
  | 'quick-ccrouter-url'
  | 'quick-api-key'
  | 'quick-models'
  | 'quick-name'
  | 'quick-review'
  // Advanced create flow
  | 'create-provider'
  | 'create-intro'
  | 'create-brand'
  | 'create-name'
  | 'create-ccrouter-url'
  | 'create-base-url'
  | 'create-api-key'
  | 'create-models'
  | 'create-prompt-pack'
  | 'create-skill-install'
  | 'create-shell-env'
  | 'create-env-confirm'
  | 'create-env-add'
  | 'create-summary'
  | 'create-running'
  | 'create-done'
  // Manage flow
  | 'manage'
  | 'manage-actions'
  | 'manage-update'
  | 'manage-update-done'
  | 'manage-remove'
  | 'manage-remove-done'
  | 'manage-models'
  | 'manage-models-saving'
  | 'manage-models-done'
  // Update all
  | 'updateAll'
  | 'updateAll-done'
  // Settings
  | 'settings-root'
  | 'settings-bin'
  // Doctor
  | 'doctor'
  // Content
  | 'about'
  | 'feedback';

/**
 * Selected variant with wrapper path
 */
export interface SelectedVariant extends VariantMeta {
  wrapperPath: string;
}

/**
 * Model overrides configuration
 */
export interface ModelOverrides {
  sonnet?: string;
  opus?: string;
  haiku?: string;
  smallFast?: string;
  defaultModel?: string;
  subagentModel?: string;
}

/**
 * Completion screen data
 */
export interface CompletionData {
  summary: string[];
  nextSteps: string[];
  help: string[];
}

/**
 * Main app state
 */
export interface AppState {
  // Navigation
  screen: Screen;

  // Provider configuration
  providerKey: string | null;
  brandKey: string;
  name: string;
  baseUrl: string;
  apiKey: string;
  apiKeyDetectedFrom: string | null;

  // Model configuration
  modelSonnet: string;
  modelOpus: string;
  modelHaiku: string;

  // Paths
  rootDir: string;
  binDir: string;

  // Feature flags
  useTweak: boolean;
  usePromptPack: boolean;
  installSkill: boolean;
  shellEnv: boolean;
  skillUpdate: boolean;

  // Extra configuration
  extraEnv: string[];

  // Progress and completion
  progressLines: string[];
  doneLines: string[];
  completion: CompletionData;

  // Variant management
  variants: VariantEntry[];
  selectedVariant: SelectedVariant | null;

  // Doctor
  doctorReport: DoctorReportItem[];
}

/**
 * App state setters and actions
 */
export interface AppActions {
  // Navigation
  setScreen: (screen: Screen) => void;
  navigateBack: () => void;

  // Provider configuration
  setProviderKey: (key: string | null) => void;
  setBrandKey: (key: string) => void;
  setName: (name: string) => void;
  setBaseUrl: (url: string) => void;
  setApiKey: (key: string) => void;
  setApiKeyDetectedFrom: (source: string | null) => void;

  // Model configuration
  setModelSonnet: (model: string) => void;
  setModelOpus: (model: string) => void;
  setModelHaiku: (model: string) => void;

  // Paths
  setRootDir: (dir: string) => void;
  setBinDir: (dir: string) => void;

  // Feature flags
  setUseTweak: (value: boolean) => void;
  setUsePromptPack: (value: boolean) => void;
  setInstallSkill: (value: boolean) => void;
  setShellEnv: (value: boolean) => void;
  setSkillUpdate: (value: boolean) => void;

  // Extra configuration
  setExtraEnv: (env: string[]) => void;
  addExtraEnv: (entry: string) => void;

  // Progress and completion
  setProgressLines: (lines: string[]) => void;
  addProgressLine: (line: string) => void;
  setDoneLines: (lines: string[]) => void;
  setCompletion: (data: CompletionData) => void;

  // Variant management
  setVariants: (variants: VariantEntry[]) => void;
  setSelectedVariant: (variant: SelectedVariant | null) => void;

  // Doctor
  setDoctorReport: (report: DoctorReportItem[]) => void;

  // Utility
  resetWizard: () => void;
}

/**
 * Combined state and actions for context
 */
export interface AppContextValue {
  state: AppState;
  actions: AppActions;
}

/**
 * Provider defaults based on provider key
 */
export interface ProviderDefaults {
  promptPack: boolean;
  skillInstall: boolean;
  shellEnv: boolean;
}
