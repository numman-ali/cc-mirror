/**
 * Variant Builder Types
 *
 * Defines interfaces for the builder pattern that eliminates duplication
 * between sync and async variant creation/update functions.
 */

import type { ProviderTemplate, ProviderEnv } from '../../providers/index.js';
import type { CreateVariantParams, TweakResult, UpdateVariantOptions, VariantMeta } from '../types.js';
import type { WrapperRuntime } from '../wrapper.js';

/**
 * Progress reporter - can be sync or async
 */
export type ReportFn = (step: string) => void | Promise<void>;

/**
 * Paths computed during variant creation/update
 */
export interface BuildPaths {
  resolvedRoot: string;
  resolvedBin: string;
  variantDir: string;
  configDir: string;
  tweakDir: string;
  wrapperPath: string;
  nativeDir: string;
  /** Target dir for the macOS unpack-and-run-via-node path. */
  unpackedDir: string;
}

/**
 * Resolved preferences computed from params and defaults
 */
export interface BuildPreferences {
  resolvedClaudeVersion: string;
  promptPackPreference: boolean;
  promptPackEnabled: boolean;
  skillInstallEnabled: boolean;
  shellEnvEnabled: boolean;
  skillUpdateEnabled: boolean;
  brandKey: string | null;
  commandStdio: 'pipe' | 'inherit';
}

/**
 * Mutable state accumulated during build
 */
export interface BuildState {
  binaryPath: string;
  claudeBinary: string;
  notes: string[];
  tweakResult: TweakResult | null;
  nativePlatform?: string;
  nativeResolvedVersion?: string;
  env?: ProviderEnv;
  resolvedApiKey?: string;
  meta?: VariantMeta;
  /** Set by TweakccStep when patch failed and pristine was restored. */
  tweakRolledBack?: boolean;
  /**
   * Runtime the wrapper script should invoke. `'native'` means exec the
   * Bun-compiled binary at state.binaryPath; `'node'` means exec
   * `node state.nodeEntryPath` (used on macOS when the binary patcher had to
   * fall back to unpack-and-run-via-node because patches would have grown
   * the Mach-O __BUN section). Persisted into VariantMeta so the update
   * flow stays on the same runtime.
   */
  wrapperRuntime?: WrapperRuntime;
  /** Absolute entry-module path for the `node` runtime. */
  nodeEntryPath?: string;
}

/**
 * Context passed to each build step
 */
export interface BuildContext {
  params: CreateVariantParams;
  provider: ProviderTemplate;
  paths: BuildPaths;
  prefs: BuildPreferences;
  state: BuildState;
  report: ReportFn;
  isAsync: boolean;
}

/**
 * Interface for a single build step
 *
 * Steps can implement either sync execute() or async executeAsync()
 * The builder will call the appropriate method based on mode.
 */
export interface BuildStep {
  name: string;

  /**
   * Execute the step synchronously
   */
  execute(ctx: BuildContext): void;

  /**
   * Execute the step asynchronously (for UI progress updates)
   */
  executeAsync(ctx: BuildContext): Promise<void>;
}

/**
 * Result of a completed build
 */
export interface BuildResult {
  meta: VariantMeta;
  wrapperPath: string;
  tweakResult: TweakResult | null;
  notes?: string[];
}

/**
 * Helper type for step execution
 */
export type StepExecutor = (ctx: BuildContext) => void | Promise<void>;

// ============================================================================
// Update-specific types
// ============================================================================

/**
 * Paths for variant update operations
 */
export interface UpdatePaths {
  resolvedRoot: string;
  resolvedBin: string | undefined;
  variantDir: string;
  nativeDir: string;
  /** Target dir for the macOS unpack-and-run-via-node path. */
  unpackedDir: string;
}

/**
 * Resolved preferences for update operations
 */
export interface UpdatePreferences {
  resolvedClaudeVersion: string;
  promptPackPreference: boolean;
  promptPackEnabled: boolean;
  skillInstallEnabled: boolean;
  shellEnvEnabled: boolean;
  skillUpdateEnabled: boolean;
  commandStdio: 'pipe' | 'inherit';
}

/**
 * Mutable state for update operations
 */
export interface UpdateState {
  notes: string[];
  tweakResult: TweakResult | null;
  brandKey: string | null;
  savedTweakccConfig?: string;
  /** Set by TweakccUpdateStep when patch failed and pristine was restored. */
  tweakRolledBack?: boolean;
  /** Resolved Claude Code version (e.g. "2.1.119") populated by InstallNativeUpdateStep. */
  nativeResolvedVersion?: string;
  /** Platform key (e.g. "darwin-arm64") populated by InstallNativeUpdateStep. */
  nativePlatform?: string;
  /** Runtime the wrapper should invoke after this update completes. */
  wrapperRuntime?: WrapperRuntime;
  /** Absolute entry-module path for the `node` runtime. */
  nodeEntryPath?: string;
}

/**
 * Context passed to each update step
 */
export interface UpdateContext {
  name: string;
  opts: UpdateVariantOptions;
  meta: VariantMeta;
  paths: UpdatePaths;
  prefs: UpdatePreferences;
  state: UpdateState;
  report: ReportFn;
  isAsync: boolean;
}

/**
 * Interface for a single update step
 */
export interface UpdateStep {
  name: string;
  execute(ctx: UpdateContext): void;
  executeAsync(ctx: UpdateContext): Promise<void>;
}
