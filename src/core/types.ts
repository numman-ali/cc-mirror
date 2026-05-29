import type { ProviderEnv } from '../providers/index.js';

export interface VariantMeta {
  schemaVersion?: 1 | 2;
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
  /**
   * Whether nativeVersion was user-pinned or should follow the project default.
   * - pinned: keep using nativeVersion unless overridden by --claude-version
   * - default: ignore nativeVersion on update and follow DEFAULT_CLAUDE_VERSION
   */
  nativeVersionSource?: 'default' | 'pinned';
  nativePlatform?: string;
  providerProfile?: {
    key: string;
    version: number;
    fingerprint: string;
  };
  capabilities?: {
    auth?: {
      mode: string;
      required: boolean;
      envKeys: string[];
    };
    endpoint?: {
      managed: boolean;
      baseUrl?: string;
    };
    models?: {
      policy: string;
      aliases?: Record<string, string>;
      display?: Record<string, { name: string; description?: string; supportedCapabilities?: string[] }>;
      startup?: string;
      smallFast?: string;
    };
    promptPack?: {
      supported: boolean;
      enabled: boolean;
    };
    shellEnv?: {
      supported: boolean;
      enabled: boolean;
      exports: string[];
    };
    skills?: {
      browser: boolean;
    };
    tools?: {
      webMode: string;
      denied: string[];
    };
    mcp?: {
      servers: string[];
    };
    runtime?: {
      updatePolicy: string;
      nonessentialTraffic: string;
    };
    tweakcc?: {
      enabled: boolean;
      profile: string;
    };
  };
  managed?: {
    settingsEnvKeys: string[];
    permissionsDeny: string[];
    mcpServerIds: string[];
  };
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
  runtimeProfile?: 'recommended' | 'privacy' | 'vanilla' | 'compat';
  tweakccProfile?: 'recommended' | 'conservative' | 'experimental';
  browserSkill?: boolean;
  capabilitiesOnly?: boolean;
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
  runtimeProfile?: 'recommended' | 'privacy' | 'vanilla' | 'compat';
  tweakccProfile?: 'recommended' | 'conservative' | 'experimental';
  browserSkill?: boolean;
  capabilitiesOnly?: boolean;
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
  model?: string;
  availableModels?: string[];
  companyAnnouncements?: string[];
  spinnerTipsEnabled?: boolean;
  feedbackSurveyRate?: number;
  includeCoAuthoredBy?: boolean;
  attribution?: {
    commit?: string;
    pr?: string;
  };
  permissions?: {
    allow?: string[];
    ask?: string[];
    deny?: string[];
  };
}

export interface TweakResult {
  status: number | null;
  stderr?: string;
  stdout?: string;
  tweakccSpec?: string;
  fallbackFromTweakccSpec?: string;
  validationStatus?: 'passed' | 'failed' | 'skipped';
  validationError?: string;
  warnings?: string[];
}
