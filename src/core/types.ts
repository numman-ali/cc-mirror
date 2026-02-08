import type { ProviderEnv } from '../providers/index.js';

export interface VariantMeta {
  name: string;
  provider: string;
  baseUrl?: string;
  createdAt: string;
  updatedAt?: string;
  claudeOrig: string;
  binaryPath: string;
  configDir: string;
  tweakDir: string;
  brand?: string;
  promptPack?: boolean;
  /** @deprecated No longer used - promptPackMode has been deprecated */
  promptPackMode?: 'minimal' | 'maximal';
  skillInstall?: boolean;
  shellEnv?: boolean;
  binDir?: string;
  nativeDir?: string;
  nativeVersion?: string;
  nativePlatform?: string;
}

export interface VariantEntry {
  name: string;
  meta: VariantMeta | null;
}

/** Progress callback for reporting installation steps */
export type ProgressCallback = (step: string) => void;

export interface CreateVariantParams {
  name: string;
  providerKey: string;
  baseUrl?: string;
  apiKey?: string;
  extraEnv?: string[];
  /** Claude Code version or channel: stable | latest | x.y.z */
  claudeVersion?: string;
  modelOverrides?: {
    sonnet?: string;
    opus?: string;
    haiku?: string;
    smallFast?: string;
    defaultModel?: string;
    subagentModel?: string;
  };
  rootDir?: string;
  binDir?: string;
  brand?: string;
  noTweak?: boolean;
  promptPack?: boolean;
  skillInstall?: boolean;
  shellEnv?: boolean;
  skillUpdate?: boolean;
  tweakccStdio?: 'pipe' | 'inherit';
  /** Callback for progress updates during installation */
  onProgress?: ProgressCallback;
}

export interface UpdateVariantOptions {
  binDir?: string;
  /** Claude Code version or channel: stable | latest | x.y.z */
  claudeVersion?: string;
  brand?: string;
  noTweak?: boolean;
  /** Skip Claude Code reinstall - for settings-only updates (models, env) */
  settingsOnly?: boolean;
  promptPack?: boolean;
  skillInstall?: boolean;
  shellEnv?: boolean;
  skillUpdate?: boolean;
  tweakccStdio?: 'pipe' | 'inherit';
  modelOverrides?: {
    sonnet?: string;
    opus?: string;
    haiku?: string;
    smallFast?: string;
    defaultModel?: string;
    subagentModel?: string;
  };
  /** Callback for progress updates during update */
  onProgress?: ProgressCallback;
}

export interface DoctorReportItem {
  name: string;
  ok: boolean;
  binaryPath?: string;
  wrapperPath: string;
}

export interface CreateVariantResult {
  meta: VariantMeta;
  wrapperPath: string;
  tweakResult: TweakResult | null;
  notes?: string[];
}

export interface UpdateVariantResult {
  meta: VariantMeta;
  tweakResult: TweakResult | null;
  notes?: string[];
}

export interface VariantConfig {
  env: ProviderEnv;
}

export interface TweakResult {
  status: number | null;
  stderr?: string;
  stdout?: string;
}
