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
  /**
   * Whether nativeVersion was user-pinned or should follow the project default.
   * - pinned: keep using nativeVersion unless overridden by --claude-version
   * - default: ignore nativeVersion on update and follow DEFAULT_CLAUDE_VERSION
   */
  nativeVersionSource?: 'default' | 'pinned';
  nativePlatform?: string;
  /**
   * True if the binary patcher failed (or corrupted the binary) on the last
   * create/update and we restored the pristine binary from cache. The
   * variant is functionally equivalent to one created with --no-tweak.
   * Field name kept for variant.json compatibility across upgrades.
   */
  tweakRolledBack?: boolean;
  /**
   * Runtime the wrapper script invokes. `'native'` (default) runs the
   * Bun-compiled binary at binaryPath; `'node'` runs `node nodeEntryPath`,
   * used on macOS when the binary patcher had to fall back to the
   * unpack-and-run-via-node path. Persisted so update preserves the choice.
   */
  wrapperRuntime?: 'native' | 'node';
  /**
   * Path of the patched JS entry module produced by the unpack-and-run-via-node
   * path. Set only when wrapperRuntime === 'node'.
   */
  nodeEntryPath?: string;
  /** Directory holding the unpacked JS modules + node_modules (set with nodeEntryPath). */
  unpackedDir?: string;
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

export interface DoctorBunInfo {
  platform: 'macho' | 'elf' | 'pe';
  moduleSize: number;
  moduleCount: number;
  entryPath?: string;
  bunVersionHint?: string;
  hasCodeSignature?: boolean;
  error?: string;
}

export interface DoctorReportItem {
  name: string;
  ok: boolean;
  binaryPath?: string;
  wrapperPath: string;
  bunInfo?: DoctorBunInfo;
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
