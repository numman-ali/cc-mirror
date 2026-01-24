/**
 * Types for TUI Business Logic Hooks
 */

import type { ProviderTemplate } from '../../providers/index.js';

/**
 * Completion result data
 */
export interface CompletionResult {
  doneLines: string[];
  summary: string[];
  nextSteps: string[];
  help: string[];
}

/**
 * Progress callback
 */
export type OnProgress = (step: string) => void;

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
 * Create variant parameters
 */
export interface CreateVariantParams {
  name: string;
  providerKey: string;
  baseUrl: string;
  apiKey: string;
  extraEnv: string[];
  modelOverrides: ModelOverrides;
  brandKey: string;
  rootDir: string;
  binDir: string;
  npmPackage: string;
  npmVersion: string;
  usePromptPack: boolean;
  promptPackMode: 'minimal' | 'maximal';
  installSkill: boolean;
  shellEnv: boolean;
  skillUpdate: boolean;
  provider: ProviderTemplate | null;
}

/**
 * Result callbacks for async operations
 */
export interface OperationCallbacks {
  setProgressLines: (lines: string[]) => void;
  addProgressLine: (line: string) => void;
  setScreen: (screen: string) => void;
  onComplete: (result: CompletionResult) => void;
  onError: (error: string) => void;
}
