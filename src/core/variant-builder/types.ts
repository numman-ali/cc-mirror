/**
 * Variant Builder Types
 *
 * Defines interfaces for the builder pattern that eliminates duplication
 * between sync and async variant creation/update functions.
 */

import type { ProviderTemplate, ProviderEnv } from '../../providers/index.js';
import type { CreateVariantParams, TweakResult, UpdateVariantOptions, VariantMeta } from '../types.js';

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
  npmDir: string;
}

/**
 * Resolved preferences computed from params and defaults
 */
export interface BuildPreferences {
  resolvedNpmPackage: string;
  resolvedNpmVersion: string;
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
  env?: ProviderEnv;
  resolvedApiKey?: string;
  meta?: VariantMeta;
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
  npmDir: string;
}

/**
 * Resolved preferences for update operations
 */
export interface UpdatePreferences {
  resolvedNpmPackage: string;
  resolvedNpmVersion: string;
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
