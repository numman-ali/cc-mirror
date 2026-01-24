/**
 * App State Hook
 * Centralizes all TUI state management
 */

import { useState, useCallback, useMemo } from 'react';
import type { Screen, AppState, AppActions, CompletionData, SelectedVariant, ProviderDefaults } from './types.js';
import type { DoctorReportItem, VariantEntry } from '../../core/types.js';

/**
 * Default completion data
 */
const defaultCompletion: CompletionData = {
  summary: [],
  nextSteps: [],
  help: [],
};

/**
 * Get provider defaults based on provider key
 */
export function getProviderDefaults(key?: string | null): ProviderDefaults {
  return {
    promptPack: key === 'zai' || key === 'minimax',
    // promptPackMode is deprecated - always use 'minimal'
    promptPackMode: 'minimal',
    skillInstall: false,
    shellEnv: key === 'zai',
  };
}

/**
 * Resolve Zai API key from environment
 */
export function resolveZaiApiKey(): {
  value: string;
  detectedFrom: string | null;
  skipPrompt: boolean;
} {
  const zaiKey = process.env.Z_AI_API_KEY?.trim();
  if (zaiKey) {
    return { value: zaiKey, detectedFrom: 'Z_AI_API_KEY', skipPrompt: true };
  }
  const anthropicKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (anthropicKey) {
    return { value: anthropicKey, detectedFrom: 'ANTHROPIC_API_KEY', skipPrompt: false };
  }
  return { value: '', detectedFrom: null, skipPrompt: false };
}

export interface UseAppStateOptions {
  initialRootDir: string;
  initialBinDir: string;
  defaultNpmPackage: string;
}

export function useCreateAppState(options: UseAppStateOptions): { state: AppState; actions: AppActions } {
  const { initialRootDir, initialBinDir, defaultNpmPackage } = options;

  // Navigation
  const [screen, setScreen] = useState<Screen>('home');

  // Provider configuration
  const [providerKey, setProviderKey] = useState<string | null>(null);
  const [brandKey, setBrandKey] = useState('auto');
  const [name, setName] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [apiKeyDetectedFrom, setApiKeyDetectedFrom] = useState<string | null>(null);

  // Model configuration
  const [modelSonnet, setModelSonnet] = useState('');
  const [modelOpus, setModelOpus] = useState('');
  const [modelHaiku, setModelHaiku] = useState('');

  // Paths
  const [rootDir, setRootDir] = useState(initialRootDir);
  const [binDir, setBinDir] = useState(initialBinDir);
  const [npmPackage, setNpmPackage] = useState(defaultNpmPackage);

  // Feature flags
  const [useTweak, setUseTweak] = useState(true);
  const [usePromptPack, setUsePromptPack] = useState(true);
  // promptPackMode is deprecated - always 'minimal'
  const promptPackMode = 'minimal' as const;
  const setPromptPackMode = (_mode: 'minimal' | 'maximal') => {}; // no-op for backward compat
  const [installSkill, setInstallSkill] = useState(false);
  const [shellEnv, setShellEnv] = useState(true);
  const [skillUpdate, setSkillUpdate] = useState(false);

  // Extra configuration
  const [extraEnv, setExtraEnv] = useState<string[]>([]);

  // Progress and completion
  const [progressLines, setProgressLines] = useState<string[]>([]);
  const [doneLines, setDoneLines] = useState<string[]>([]);
  const [completion, setCompletion] = useState<CompletionData>(defaultCompletion);

  // Variant management
  const [variants, setVariants] = useState<VariantEntry[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<SelectedVariant | null>(null);

  // Doctor
  const [doctorReport, setDoctorReport] = useState<DoctorReportItem[]>([]);

  // Reset wizard to initial state
  const resetWizard = useCallback(() => {
    setProviderKey(null);
    setBrandKey('auto');
    setName('');
    setBaseUrl('');
    setApiKey('');
    setModelSonnet('');
    setModelOpus('');
    setModelHaiku('');
    setApiKeyDetectedFrom(null);
    setNpmPackage(defaultNpmPackage);
    setExtraEnv([]);
    setUseTweak(true);
    setUsePromptPack(true);
    // promptPackMode is deprecated - no need to reset
    setInstallSkill(true);
    setShellEnv(true);
    setSkillUpdate(false);
    setCompletion(defaultCompletion);
  }, [defaultNpmPackage]);

  // Navigate back based on current screen
  const navigateBack = useCallback(() => {
    switch (screen) {
      case 'home':
        setScreen('exit');
        break;
      // Quick setup flow - back steps
      case 'quick-api-key':
        setScreen('quick-provider');
        break;
      case 'quick-model-opus':
        setScreen('quick-api-key');
        break;
      case 'quick-model-sonnet':
        setScreen('quick-model-opus');
        break;
      case 'quick-model-haiku':
        setScreen('quick-model-sonnet');
        break;
      case 'quick-name':
        // Need provider context - handled externally
        setScreen('quick-api-key');
        break;
      case 'quick-provider':
        setScreen('home');
        break;
      case 'create-model-opus':
        setScreen('create-api-key');
        break;
      case 'create-model-sonnet':
        setScreen('create-model-opus');
        break;
      case 'create-model-haiku':
        setScreen('create-model-sonnet');
        break;
      // Settings - back to home
      case 'settings-root':
      case 'settings-bin':
        setScreen('home');
        break;
      // Model configuration screens - back through flow
      case 'manage-models-opus':
        setScreen('manage-actions');
        break;
      case 'manage-models-sonnet':
        setScreen('manage-models-opus');
        break;
      case 'manage-models-haiku':
        setScreen('manage-models-sonnet');
        break;
      case 'manage-models-done':
        setScreen('manage-actions');
        break;
      // Completion/done screens - back to home
      case 'create-done':
      case 'manage-update-done':
      case 'manage-tweak-done':
      case 'manage-remove-done':
      case 'updateAll-done':
        setScreen('home');
        break;
      // Doctor screen - home
      case 'doctor':
        setScreen('home');
        break;
      // Default: any screen starting with create, manage, or updateAll goes home
      default:
        if (screen.startsWith('create') || screen.startsWith('manage') || screen.startsWith('updateAll')) {
          setScreen('home');
        }
        break;
    }
  }, [screen]);

  // Add a progress line
  const addProgressLine = useCallback((line: string) => {
    setProgressLines((prev) => [...prev, line]);
  }, []);

  // Add extra env entry
  const addExtraEnv = useCallback((entry: string) => {
    setExtraEnv((prev) => [...prev, entry]);
  }, []);

  // Assemble state
  const state = useMemo<AppState>(
    () => ({
      screen,
      providerKey,
      brandKey,
      name,
      baseUrl,
      apiKey,
      apiKeyDetectedFrom,
      modelSonnet,
      modelOpus,
      modelHaiku,
      rootDir,
      binDir,
      npmPackage,
      useTweak,
      usePromptPack,
      promptPackMode,
      installSkill,
      shellEnv,
      skillUpdate,
      extraEnv,
      progressLines,
      doneLines,
      completion,
      variants,
      selectedVariant,
      doctorReport,
    }),
    [
      screen,
      providerKey,
      brandKey,
      name,
      baseUrl,
      apiKey,
      apiKeyDetectedFrom,
      modelSonnet,
      modelOpus,
      modelHaiku,
      rootDir,
      binDir,
      npmPackage,
      useTweak,
      usePromptPack,
      promptPackMode,
      installSkill,
      shellEnv,
      skillUpdate,
      extraEnv,
      progressLines,
      doneLines,
      completion,
      variants,
      selectedVariant,
      doctorReport,
    ]
  );

  // Assemble actions
  const actions = useMemo<AppActions>(
    () => ({
      setScreen,
      navigateBack,
      setProviderKey,
      setBrandKey,
      setName,
      setBaseUrl,
      setApiKey,
      setApiKeyDetectedFrom,
      setModelSonnet,
      setModelOpus,
      setModelHaiku,
      setRootDir,
      setBinDir,
      setNpmPackage,
      setUseTweak,
      setUsePromptPack,
      setPromptPackMode,
      setInstallSkill,
      setShellEnv,
      setSkillUpdate,
      setExtraEnv,
      addExtraEnv,
      setProgressLines,
      addProgressLine,
      setDoneLines,
      setCompletion,
      setVariants,
      setSelectedVariant,
      setDoctorReport,
      resetWizard,
    }),
    [navigateBack, addProgressLine, addExtraEnv, resetWizard]
  );

  return { state, actions };
}
