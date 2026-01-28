/**
 * VariantUpdater - Orchestrates variant updates using composable steps
 *
 * This updater eliminates duplication between sync and async updateVariant functions
 * by using a common set of steps that can execute in either mode.
 */

import path from 'node:path';
import { getProvider } from '../../providers/index.js';
import { DEFAULT_NPM_PACKAGE, DEFAULT_NPM_VERSION, DEFAULT_ROOT } from '../constants.js';
import { expandTilde } from '../paths.js';
import { loadVariantMeta } from '../variants.js';
import type { UpdateVariantOptions, UpdateVariantResult } from '../types.js';
import type { ReportFn, UpdateContext, UpdatePaths, UpdatePreferences, UpdateState, UpdateStep } from './types.js';

// Import steps
import { RebuildUpdateStep } from './update-steps/RebuildUpdateStep.js';
import { InstallNpmUpdateStep } from './update-steps/InstallNpmUpdateStep.js';
import { SwarmModeUpdateStep } from './update-steps/SwarmModeUpdateStep.js';
import { TeamModeUpdateStep } from './update-steps/TeamModeUpdateStep.js';
import { ModelOverridesStep } from './update-steps/ModelOverridesStep.js';
import { TweakccUpdateStep } from './update-steps/TweakccUpdateStep.js';
import { WrapperUpdateStep } from './update-steps/WrapperUpdateStep.js';
import { ConfigUpdateStep } from './update-steps/ConfigUpdateStep.js';
import { ShellEnvUpdateStep } from './update-steps/ShellEnvUpdateStep.js';
import { SkillInstallUpdateStep } from './update-steps/SkillInstallUpdateStep.js';
import { FinalizeUpdateStep } from './update-steps/FinalizeUpdateStep.js';

// Helper functions
const normalizeNpmPackage = (value?: string) => (value && value.trim().length > 0 ? value.trim() : DEFAULT_NPM_PACKAGE);

const normalizeNpmVersion = () => DEFAULT_NPM_VERSION;

const shouldEnablePromptPack = (providerKey: string) => {
  // Check if provider has noPromptPack set (e.g., mirror provider)
  const provider = getProvider(providerKey);
  if (provider?.noPromptPack) return false;
  // Only auto-enable for providers with prompt pack support
  return providerKey === 'zai' || providerKey === 'minimax';
};

const shouldInstallSkills = (providerKey: string) => providerKey === 'zai' || providerKey === 'minimax';

const shouldEnableShellEnv = (providerKey: string) => providerKey === 'zai';

// Helper to yield to event loop (for async mode)
const yieldToEventLoop = () => new Promise<void>((resolve) => setImmediate(resolve));

/**
 * Updates variants using composable steps
 */
export class VariantUpdater {
  private steps: UpdateStep[];

  constructor(private isAsync: boolean = false) {
    // Register steps in execution order
    this.steps = [
      new RebuildUpdateStep(),
      new InstallNpmUpdateStep(),
      new SwarmModeUpdateStep(), // Patches cli.js for native multi-agent features (enabled by default)
      new TeamModeUpdateStep(), // Legacy team mode (deprecated, if enabled)
      new ModelOverridesStep(),
      new TweakccUpdateStep(),
      new WrapperUpdateStep(),
      new ConfigUpdateStep(),
      new ShellEnvUpdateStep(),
      new SkillInstallUpdateStep(),
      new FinalizeUpdateStep(),
    ];
  }

  /**
   * Initialize the update context
   */
  private initContext(rootDir: string, name: string, opts: UpdateVariantOptions): UpdateContext {
    const resolvedRoot = expandTilde(rootDir || DEFAULT_ROOT) ?? rootDir;
    const variantDir = path.join(resolvedRoot, name);
    const meta = loadVariantMeta(variantDir);
    if (!meta) throw new Error(`Variant not found: ${name}`);

    const resolvedNpmPackage = normalizeNpmPackage(opts.npmPackage ?? meta.npmPackage);
    const resolvedNpmVersion = normalizeNpmVersion();
    const promptPackPreference = opts.promptPack ?? meta.promptPack ?? shouldEnablePromptPack(meta.provider);
    const promptPackEnabled = !opts.noTweak && promptPackPreference;
    const skillInstallEnabled = opts.skillInstall ?? meta.skillInstall ?? shouldInstallSkills(meta.provider);
    const shellEnvEnabled = opts.shellEnv ?? meta.shellEnv ?? shouldEnableShellEnv(meta.provider);
    const skillUpdateEnabled = Boolean(opts.skillUpdate);
    const commandStdio = opts.tweakccStdio || 'inherit';

    const paths: UpdatePaths = {
      resolvedRoot,
      resolvedBin: opts.binDir ? (expandTilde(opts.binDir) ?? opts.binDir) : meta.binDir,
      variantDir,
      npmDir: meta.npmDir || path.join(variantDir, 'npm'),
    };

    const prefs: UpdatePreferences = {
      resolvedNpmPackage,
      resolvedNpmVersion,
      promptPackPreference,
      promptPackEnabled,
      skillInstallEnabled,
      shellEnvEnabled,
      skillUpdateEnabled,
      commandStdio,
    };

    const state: UpdateState = {
      notes: [],
      tweakResult: null,
      brandKey: meta.brand ?? null,
    };

    // Create reporter function
    const report: ReportFn = this.isAsync
      ? async (step: string) => {
          opts.onProgress?.(step);
          await yieldToEventLoop();
        }
      : (step: string) => {
          opts.onProgress?.(step);
        };

    return {
      name,
      opts,
      meta,
      paths,
      prefs,
      state,
      report,
      isAsync: this.isAsync,
    };
  }

  /**
   * Update a variant synchronously
   */
  update(rootDir: string, name: string, opts: UpdateVariantOptions = {}): UpdateVariantResult {
    if (this.isAsync) {
      throw new Error('Use updateAsync() for async updates');
    }

    const ctx = this.initContext(rootDir, name, opts);

    for (const step of this.steps) {
      step.execute(ctx);
    }

    return this.toResult(ctx);
  }

  /**
   * Update a variant asynchronously
   */
  async updateAsync(rootDir: string, name: string, opts: UpdateVariantOptions = {}): Promise<UpdateVariantResult> {
    if (!this.isAsync) {
      throw new Error('Use update() for sync updates');
    }

    const ctx = this.initContext(rootDir, name, opts);

    for (const step of this.steps) {
      await step.executeAsync(ctx);
    }

    return this.toResult(ctx);
  }

  /**
   * Convert update context to result
   */
  private toResult(ctx: UpdateContext): UpdateVariantResult {
    return {
      meta: ctx.meta,
      tweakResult: ctx.state.tweakResult,
      notes: ctx.state.notes.length > 0 ? ctx.state.notes : undefined,
    };
  }
}
