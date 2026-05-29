/**
 * App State Hook
 * Centralizes all TUI state management
 */

import { useState, useCallback, useMemo } from 'react';
import type { Screen, AppState, AppActions, CompletionData, SelectedVariant, ProviderDefaults } from './types.js';
import type { DoctorReportItem, VariantEntry } from '../../core/types.js';
import { getTuiProviderCapabilities, resolveCredentialDefaults } from '../providerCapabilities.js';

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
  const capabilities = getTuiProviderCapabilities(key || 'custom');
  return {
    promptPack: capabilities.promptPack.defaultEnabled,
    skillInstall: capabilities.skillInstall.defaultEnabled,
    shellEnv: capabilities.shellEnv.defaultEnabled,
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
  return resolveCredentialDefaults(getTuiProviderCapabilities('zai'));
}

export interface UseAppStateOptions {
  initialRootDir: string;
  initialBinDir: string;
}

export function useCreateAppState(options: UseAppStateOptions): { state: AppState; actions: AppActions } {
  const { initialRootDir, initialBinDir } = options;

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

  // Feature flags
  const [useTweak, setUseTweak] = useState(true);
  const [usePromptPack, setUsePromptPack] = useState(true);
  const [installSkill, setInstallSkill] = useState(false);
  const [shellEnv, setShellEnv] = useState(false);
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
    setExtraEnv([]);
    setUseTweak(true);
    setUsePromptPack(true);
    setInstallSkill(false);
    setShellEnv(false);
    setSkillUpdate(false);
    setCompletion(defaultCompletion);
  }, []);

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
      case 'quick-intro':
        setScreen('quick-provider');
        break;
      case 'quick-ccrouter-url':
      case 'quick-models':
        setScreen('quick-api-key');
        break;
      case 'quick-name':
        setScreen('quick-models');
        break;
      case 'quick-review':
        setScreen('quick-name');
        break;
      case 'quick-provider':
        setScreen('home');
        break;
      case 'create-intro':
        setScreen('create-provider');
        break;
      case 'create-brand':
        setScreen('create-intro');
        break;
      case 'create-name':
        setScreen('create-brand');
        break;
      case 'create-ccrouter-url':
      case 'create-base-url':
        setScreen('create-name');
        break;
      case 'create-api-key':
        setScreen('create-base-url');
        break;
      case 'create-models':
        setScreen('create-api-key');
        break;
      // Settings - back to home
      case 'settings-root':
      case 'settings-bin':
        setScreen('home');
        break;
      // Model configuration screens - back through flow
      case 'manage-models':
      case 'manage-models-saving':
        setScreen('manage-actions');
        break;
      case 'manage-models-done':
        setScreen('manage-actions');
        break;
      // Completion/done screens - back to home
      case 'create-done':
      case 'manage-update-done':
      case 'manage-remove-done':
      case 'updateAll-done':
        setScreen('home');
        break;
      // Doctor screen - home
      case 'doctor':
        setScreen('home');
        break;
      case 'about':
      case 'feedback':
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
      useTweak,
      usePromptPack,
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
      useTweak,
      usePromptPack,
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
      setUseTweak,
      setUsePromptPack,
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
