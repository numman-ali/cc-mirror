/**
 * VariantBuilder - Orchestrates variant creation using composable steps
 *
 * This builder eliminates duplication between sync and async createVariant functions
 * by using a common set of steps that can execute in either mode.
 */

import path from 'node:path';
import { getProvider, type ProviderTemplate } from '../../providers/index.js';
import {
  DEFAULT_BIN_DIR,
  DEFAULT_NPM_PACKAGE,
  DEFAULT_NPM_VERSION,
  DEFAULT_ROOT,
  TEAM_MODE_SUPPORTED,
} from '../constants.js';
import { assertValidVariantName, expandTilde, getWrapperPath } from '../paths.js';
import type { CreateVariantParams, CreateVariantResult } from '../types.js';
import type { BuildContext, BuildPaths, BuildPreferences, BuildState, BuildStep, ReportFn } from './types.js';

// Import steps (will be created incrementally)
import { PrepareDirectoriesStep } from './steps/PrepareDirectoriesStep.js';
import { InstallNpmStep } from './steps/InstallNpmStep.js';
import { TeamModeStep } from './steps/TeamModeStep.js';
import { WriteConfigStep } from './steps/WriteConfigStep.js';
import { BrandThemeStep } from './steps/BrandThemeStep.js';
import { TweakccStep } from './steps/TweakccStep.js';
import { WrapperStep } from './steps/WrapperStep.js';
import { ShellEnvStep } from './steps/ShellEnvStep.js';
import { SkillInstallStep } from './steps/SkillInstallStep.js';
import { FinalizeStep } from './steps/FinalizeStep.js';

// Helper functions
const normalizeNpmPackage = (value?: string) => (value && value.trim().length > 0 ? value.trim() : DEFAULT_NPM_PACKAGE);

const normalizeNpmVersion = () => DEFAULT_NPM_VERSION;

const shouldEnablePromptPack = (providerKey: string, provider?: ProviderTemplate) => {
  // Providers with noPromptPack: true skip prompt pack overlays
  if (provider?.noPromptPack) return false;
  return providerKey === 'zai' || providerKey === 'minimax';
};

const shouldInstallSkills = (providerKey: string) => providerKey === 'zai' || providerKey === 'minimax';

const shouldEnableShellEnv = (providerKey: string) => providerKey === 'zai';

// Helper to yield to event loop (for async mode)
const yieldToEventLoop = () => new Promise<void>((resolve) => setImmediate(resolve));

/**
 * Builds variants using composable steps
 */
export class VariantBuilder {
  private steps: BuildStep[];

  constructor(private isAsync: boolean = false) {
    // Register steps in execution order
    this.steps = [
      new PrepareDirectoriesStep(),
      new InstallNpmStep(),
      new WriteConfigStep(),
      new BrandThemeStep(), // Creates tweakcc/config.json
      ...(TEAM_MODE_SUPPORTED ? [new TeamModeStep()] : []), // Team mode is gated by TEAM_MODE_SUPPORTED
      new TweakccStep(),
      new WrapperStep(),
      new ShellEnvStep(),
      new SkillInstallStep(),
      new FinalizeStep(),
    ];
  }

  /**
   * Initialize the build context from params
   */
  private initContext(params: CreateVariantParams): BuildContext {
    const provider = getProvider(params.providerKey);
    if (!provider) throw new Error(`Unknown provider: ${params.providerKey}`);
    if (!params.name) throw new Error('Variant name is required');
    assertValidVariantName(params.name);

    const rootDir = params.rootDir ?? DEFAULT_ROOT;
    const binDir = params.binDir ?? DEFAULT_BIN_DIR;
    const resolvedRoot = expandTilde(rootDir) ?? rootDir;
    const resolvedBin = expandTilde(binDir) ?? binDir;

    const variantDir = path.join(resolvedRoot, params.name);
    const configDir = path.join(variantDir, 'config');
    const tweakDir = path.join(variantDir, 'tweakcc');
    const wrapperPath = getWrapperPath(resolvedBin, params.name);
    const npmDir = path.join(variantDir, 'npm');

    const paths: BuildPaths = {
      resolvedRoot,
      resolvedBin,
      variantDir,
      configDir,
      tweakDir,
      wrapperPath,
      npmDir,
    };

    const resolvedNpmPackage = normalizeNpmPackage(params.npmPackage);
    const resolvedNpmVersion = normalizeNpmVersion();
    const promptPackPreference = params.promptPack ?? shouldEnablePromptPack(params.providerKey, provider);
    const promptPackEnabled = !params.noTweak && promptPackPreference;
    const skillInstallEnabled = params.skillInstall ?? shouldInstallSkills(params.providerKey);
    const shellEnvEnabled = params.shellEnv ?? shouldEnableShellEnv(params.providerKey);
    const skillUpdateEnabled = Boolean(params.skillUpdate);
    const commandStdio = params.tweakccStdio ?? 'inherit';

    const prefs: BuildPreferences = {
      resolvedNpmPackage,
      resolvedNpmVersion,
      promptPackPreference,
      promptPackEnabled,
      skillInstallEnabled,
      shellEnvEnabled,
      skillUpdateEnabled,
      brandKey: null, // Will be resolved in BrandThemeStep
      commandStdio,
    };

    const state: BuildState = {
      binaryPath: '',
      claudeBinary: '',
      notes: [],
      tweakResult: null,
    };

    // Create reporter function
    const report: ReportFn = this.isAsync
      ? async (step: string) => {
          params.onProgress?.(step);
          await yieldToEventLoop();
        }
      : (step: string) => {
          params.onProgress?.(step);
        };

    return {
      params,
      provider,
      paths,
      prefs,
      state,
      report,
      isAsync: this.isAsync,
    };
  }

  /**
   * Build a variant synchronously
   */
  build(params: CreateVariantParams): CreateVariantResult {
    if (this.isAsync) {
      throw new Error('Use buildAsync() for async builds');
    }

    const ctx = this.initContext(params);

    for (const step of this.steps) {
      step.execute(ctx);
    }

    return this.toResult(ctx);
  }

  /**
   * Build a variant asynchronously
   */
  async buildAsync(params: CreateVariantParams): Promise<CreateVariantResult> {
    if (!this.isAsync) {
      throw new Error('Use build() for sync builds');
    }

    const ctx = this.initContext(params);

    for (const step of this.steps) {
      await step.executeAsync(ctx);
    }

    return this.toResult(ctx);
  }

  /**
   * Convert build context to result
   */
  private toResult(ctx: BuildContext): CreateVariantResult {
    // The FinalizeStep should have populated state with the meta
    if (!ctx.state.meta) {
      throw new Error('FinalizeStep did not populate meta');
    }
    return {
      meta: ctx.state.meta,
      wrapperPath: ctx.paths.wrapperPath,
      tweakResult: ctx.state.tweakResult,
      notes: ctx.state.notes.length > 0 ? ctx.state.notes : undefined,
    };
  }
}
