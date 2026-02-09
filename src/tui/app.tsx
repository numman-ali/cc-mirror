import React, { useCallback, useEffect, useMemo, useState } from 'react';
import * as fs from 'node:fs';
import { Box, Text, useApp, useInput } from 'ink';
import SelectInput from 'ink-select-input';
import { getWrapperPath } from '../core/paths.js';
import type { BrandPreset } from '../brands/index.js';
import * as defaultBrands from '../brands/index.js';
import type { ProviderEnv, ProviderTemplate } from '../providers/index.js';
import type {
  CreateVariantResult,
  DoctorReportItem,
  UpdateVariantResult,
  VariantEntry,
  VariantMeta,
} from '../core/types.js';
import * as defaultCore from '../core/index.js';
import * as defaultProviders from '../providers/index.js';
// State management and router modules (available for future refactoring)
// import { useCreateAppState, getProviderDefaults, resolveZaiApiKey } from './state/index.js';
// import { useEscapeNavigation } from './router/index.js';

// Business logic hooks
import {
  useVariantCreate,
  useVariantUpdate,
  useUpdateAll,
  useModelConfig,
  type CompletionResult,
} from './hooks/index.js';

// Import clean screen components
import {
  HomeScreen,
  ProviderSelectScreen,
  ProviderIntroScreen,
  ApiKeyScreen,
  RouterUrlScreen,
  SummaryScreen,
  ProgressScreen,
  CompletionScreen,
  VariantListScreen,
  VariantActionsScreen,
  DiagnosticsScreen,
  ModelConfigScreen,
  EnvEditorScreen,
  AboutScreen,
  FeedbackScreen,
} from './screens/index.js';

// Import UI components
import { Frame, Divider, HintBar } from './components/ui/Layout.js';
import { YesNoSelect } from './components/ui/YesNoSelect.js';
import { Header } from './components/ui/Typography.js';
import { TextField } from './components/ui/Input.js';
import { colors } from './components/ui/theme.js';

export interface CoreModule {
  DEFAULT_ROOT: string;
  DEFAULT_BIN_DIR: string;
  DEFAULT_CLAUDE_VERSION?: string;
  listVariants: (rootDir: string) => VariantEntry[];
  createVariant: (params: {
    name: string;
    providerKey: string;
    baseUrl?: string;
    apiKey?: string;
    extraEnv?: string[];
    claudeVersion?: string;
    modelOverrides?: {
      sonnet?: string;
      opus?: string;
      haiku?: string;
      smallFast?: string;
      defaultModel?: string;
      subagentModel?: string;
    };
    brand?: string;
    rootDir?: string;
    binDir?: string;
    noTweak?: boolean;
    promptPack?: boolean;
    promptPackMode?: 'minimal' | 'maximal';
    skillInstall?: boolean;
    shellEnv?: boolean;
    skillUpdate?: boolean;
    tweakccStdio?: 'pipe' | 'inherit';
    onProgress?: (step: string) => void;
  }) => CreateVariantResult;
  updateVariant: (
    rootDir: string,
    name: string,
    opts?: {
      tweakccStdio?: 'pipe' | 'inherit';
      binDir?: string;
      claudeVersion?: string;
      promptPack?: boolean;
      promptPackMode?: 'minimal' | 'maximal';
      skillInstall?: boolean;
      shellEnv?: boolean;
      modelOverrides?: {
        sonnet?: string;
        opus?: string;
        haiku?: string;
        smallFast?: string;
        defaultModel?: string;
        subagentModel?: string;
      };
      onProgress?: (step: string) => void;
    }
  ) => UpdateVariantResult;
  tweakVariant: (rootDir: string, name: string) => void;
  removeVariant: (rootDir: string, name: string) => void;
  doctor: (rootDir: string, binDir: string) => DoctorReportItem[];
  createVariantAsync?: (params: {
    name: string;
    providerKey: string;
    baseUrl?: string;
    apiKey?: string;
    extraEnv?: string[];
    claudeVersion?: string;
    modelOverrides?: {
      sonnet?: string;
      opus?: string;
      haiku?: string;
      smallFast?: string;
      defaultModel?: string;
      subagentModel?: string;
    };
    brand?: string;
    rootDir?: string;
    binDir?: string;
    noTweak?: boolean;
    promptPack?: boolean;
    promptPackMode?: 'minimal' | 'maximal';
    skillInstall?: boolean;
    shellEnv?: boolean;
    skillUpdate?: boolean;
    tweakccStdio?: 'pipe' | 'inherit';
    onProgress?: (step: string) => void;
  }) => Promise<CreateVariantResult>;
  updateVariantAsync?: (
    rootDir: string,
    name: string,
    opts?: {
      tweakccStdio?: 'pipe' | 'inherit';
      binDir?: string;
      claudeVersion?: string;
      promptPack?: boolean;
      promptPackMode?: 'minimal' | 'maximal';
      skillInstall?: boolean;
      shellEnv?: boolean;
      modelOverrides?: {
        sonnet?: string;
        opus?: string;
        haiku?: string;
        smallFast?: string;
        defaultModel?: string;
        subagentModel?: string;
      };
      onProgress?: (step: string) => void;
    }
  ) => Promise<UpdateVariantResult>;
}

export interface ProvidersModule {
  listProviders: (includeExperimental?: boolean) => ProviderTemplate[];
  getProvider: (key: string) => ProviderTemplate | undefined;
  buildEnv: (params: {
    providerKey: string;
    baseUrl?: string;
    apiKey?: string;
    extraEnv?: string[];
    modelOverrides?: {
      sonnet?: string;
      opus?: string;
      haiku?: string;
      smallFast?: string;
      defaultModel?: string;
      subagentModel?: string;
    };
  }) => ProviderEnv;
}

export interface BrandsModule {
  listBrandPresets: () => BrandPreset[];
}

export interface AppProps {
  core?: CoreModule;
  providers?: ProvidersModule;
  brands?: BrandsModule;
  initialRootDir?: string;
  initialBinDir?: string;
}

export const App: React.FC<AppProps> = ({
  core = defaultCore,
  providers = defaultProviders,
  brands = defaultBrands,
  initialRootDir,
  initialBinDir,
}: AppProps = {}) => {
  // Exit handler from Ink
  const { exit } = useApp();

  // No splash screen for clean UI
  const [screen, setScreen] = useState('home');
  const [providerKey, setProviderKey] = useState<string | null>(null);
  const [brandKey, setBrandKey] = useState('auto');
  const [name, setName] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [modelSonnet, setModelSonnet] = useState('');
  const [modelOpus, setModelOpus] = useState('');
  const [modelHaiku, setModelHaiku] = useState('');
  const [rootDir, _setRootDir] = useState(initialRootDir || core.DEFAULT_ROOT);
  const [binDir, _setBinDir] = useState(initialBinDir || core.DEFAULT_BIN_DIR);
  const [claudeVersion, setClaudeVersion] = useState(core.DEFAULT_CLAUDE_VERSION || 'latest');
  const [usePromptPack, setUsePromptPack] = useState(true);
  // promptPackMode is deprecated - always use 'minimal'
  const promptPackMode = 'minimal' as const;
  const [installSkill, setInstallSkill] = useState(false);
  const [shellEnv, setShellEnv] = useState(true);
  const [skillUpdate, setSkillUpdate] = useState(false);
  const [extraEnv, setExtraEnv] = useState<string[]>([]);
  const [progressLines, setProgressLines] = useState<string[]>([]);
  const [doneLines, setDoneLines] = useState<string[]>([]);
  const [completionSummary, setCompletionSummary] = useState<string[]>([]);
  const [completionNextSteps, setCompletionNextSteps] = useState<string[]>([]);
  const [completionHelp, setCompletionHelp] = useState<string[]>([]);
  const [variants, setVariants] = useState<VariantEntry[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<(VariantMeta & { wrapperPath: string }) | null>(null);
  const [doctorReport, setDoctorReport] = useState<DoctorReportItem[]>([]);
  const [apiKeyDetectedFrom, setApiKeyDetectedFrom] = useState<string | null>(null);

  // Include experimental providers in the UI list
  const providerList = useMemo(() => {
    const list = providers.listProviders(true);
    return [...list].sort((a, b) => {
      if (a.experimental && !b.experimental) return 1;
      if (!a.experimental && b.experimental) return -1;
      const aLabel = a.label.toLowerCase();
      const bLabel = b.label.toLowerCase();
      if (aLabel < bLabel) return -1;
      if (aLabel > bLabel) return 1;
      return 0;
    });
  }, [providers]);
  const brandList = useMemo(() => brands.listBrandPresets(), [brands]);
  const provider = useMemo(() => (providerKey ? providers.getProvider(providerKey) : null), [providerKey, providers]);
  const effectiveBaseUrl = useMemo(() => baseUrl || provider?.baseUrl || '', [baseUrl, provider]);
  const modelOverrides = useMemo(
    () => ({
      sonnet: modelSonnet.trim() || undefined,
      opus: modelOpus.trim() || undefined,
      haiku: modelHaiku.trim() || undefined,
    }),
    [modelSonnet, modelOpus, modelHaiku]
  );

  const providerDefaults = (
    key?: string | null
  ): {
    promptPack: boolean;
    skillInstall: boolean;
    shellEnv: boolean;
  } => ({
    promptPack: key === 'zai' || key === 'minimax',
    skillInstall: key === 'zai' || key === 'minimax',
    shellEnv: key === 'zai',
  });

  const resolveZaiApiKey = (): {
    value: string;
    detectedFrom: string | null;
    skipPrompt: boolean;
  } => {
    const zaiKey = process.env.Z_AI_API_KEY?.trim();
    if (zaiKey) {
      return { value: zaiKey, detectedFrom: 'Z_AI_API_KEY', skipPrompt: true };
    }
    const anthropicKey = process.env.ANTHROPIC_API_KEY?.trim();
    if (anthropicKey) {
      return { value: anthropicKey, detectedFrom: 'ANTHROPIC_API_KEY', skipPrompt: false };
    }
    return { value: '', detectedFrom: null, skipPrompt: false };
  };

  useInput((input, key) => {
    if (key.escape) {
      // ESC key navigation - handle all screens
      switch (screen) {
        case 'home':
          setScreen('exit');
          break;
        // Quick setup flow - back steps
        case 'quick-intro':
          setScreen('quick-provider');
          break;
        case 'quick-ccrouter-url':
          setScreen('quick-intro');
          break;
        case 'quick-api-key':
          setScreen('quick-intro');
          break;
        case 'quick-models':
          setScreen(
            (providerKey === 'zai' && apiKeyDetectedFrom === 'Z_AI_API_KEY') || provider?.credentialOptional
              ? 'quick-intro'
              : 'quick-api-key'
          );
          break;
        case 'quick-name':
          if (providerKey === 'ccrouter') {
            setScreen('quick-ccrouter-url');
          } else {
            const shouldConfigureModels =
              Boolean(provider?.requiresModelMapping) || providerKey === 'zai' || providerKey === 'minimax';
            const skipApiKey =
              (providerKey === 'zai' && apiKeyDetectedFrom === 'Z_AI_API_KEY') || provider?.credentialOptional;

            setScreen(shouldConfigureModels ? 'quick-models' : skipApiKey ? 'quick-intro' : 'quick-api-key');
          }
          break;
        case 'quick-provider':
          setScreen('home');
          break;
        // Create flow - back steps
        case 'create-intro':
          setScreen('create-provider');
          break;
        case 'create-brand':
          setScreen('create-intro');
          break;
        case 'create-ccrouter-url':
          setScreen('create-name');
          break;
        case 'create-models':
          // Some providers can skip API key entry (e.g., zai with detected Z_AI_API_KEY).
          // Going "back" from models should return to the actual previous screen.
          setScreen(
            (providerKey === 'zai' && apiKeyDetectedFrom === 'Z_AI_API_KEY') || provider?.credentialOptional
              ? 'create-base-url'
              : 'create-api-key'
          );
          break;
        // Model configuration screens - back through flow
        case 'manage-models':
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
        // Feedback screen - home
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
    }
  });

  useEffect(() => {
    if (screen === 'manage') {
      setVariants(core.listVariants(rootDir));
    }
  }, [screen, rootDir, core]);

  useEffect(() => {
    if (screen !== 'doctor') return;
    setDoctorReport(core.doctor(rootDir, binDir));
  }, [screen, rootDir, binDir, core]);

  // Shared callback for hooks to set completion state
  const handleOperationComplete = useCallback((result: CompletionResult) => {
    setDoneLines(result.doneLines);
    setCompletionSummary(result.summary);
    setCompletionNextSteps(result.nextSteps);
    setCompletionHelp(result.help);
  }, []);

  // Create variant operation (extracted to useVariantCreate hook)
  const createParams = useMemo(
    () => ({
      name,
      providerKey: providerKey || 'zai',
      provider: provider ?? null,
      baseUrl: effectiveBaseUrl,
      apiKey,
      extraEnv,
      claudeVersion,
      modelOverrides,
      brandKey,
      rootDir,
      binDir,
      usePromptPack,
      promptPackMode,
      installSkill,
      shellEnv,
      skillUpdate,
    }),
    [
      name,
      providerKey,
      provider,
      effectiveBaseUrl,
      apiKey,
      extraEnv,
      claudeVersion,
      modelOverrides,
      brandKey,
      rootDir,
      binDir,
      usePromptPack,
      promptPackMode,
      installSkill,
      shellEnv,
      skillUpdate,
    ]
  );

  useVariantCreate({
    screen,
    params: createParams,
    core,
    setProgressLines,
    setScreen,
    onComplete: handleOperationComplete,
  });

  // Update variant operation (extracted to useVariantUpdate hook)
  useVariantUpdate({
    screen,
    selectedVariant,
    rootDir,
    binDir,
    core,
    setProgressLines,
    setScreen,
    onComplete: handleOperationComplete,
  });

  // Save model configuration operation (extracted to useModelConfig hook)
  useModelConfig({
    screen,
    selectedVariant,
    rootDir,
    binDir,
    modelOpus,
    modelSonnet,
    modelHaiku,
    core,
    setProgressLines,
    setScreen,
    onComplete: handleOperationComplete,
  });

  // Update all variants operation (extracted to useUpdateAll hook)
  useUpdateAll({
    screen,
    rootDir,
    binDir,
    core,
    setProgressLines,
    setScreen,
    onComplete: handleOperationComplete,
  });

  const resetWizard = () => {
    setProviderKey(null);
    setBrandKey('auto');
    setName('');
    setBaseUrl('');
    setApiKey('');
    setModelSonnet('');
    setModelOpus('');
    setModelHaiku('');
    setApiKeyDetectedFrom(null);
    setClaudeVersion(core.DEFAULT_CLAUDE_VERSION || 'latest');
    setExtraEnv([]);
    setUsePromptPack(true);
    setInstallSkill(true);
    setShellEnv(true);
    setSkillUpdate(false);
    setCompletionSummary([]);
    setCompletionNextSteps([]);
    setCompletionHelp([]);
  };

  // Exit screen - actually exit the app after showing the message
  useEffect(() => {
    if (screen === 'exit') {
      const timer = setTimeout(() => exit(), 100);
      return () => clearTimeout(timer);
    }
  }, [screen, exit]);

  if (screen === 'exit') {
    return (
      <Frame>
        <Header title="CC-MIRROR" subtitle="Goodbye. Happy coding!" />
      </Frame>
    );
  }

  if (screen === 'home') {
    return (
      <HomeScreen
        onSelect={(value) => {
          if (value === 'quick') {
            resetWizard();
            setScreen('quick-provider');
          }
          if (value === 'create') {
            resetWizard();
            setScreen('create-provider');
          }
          if (value === 'manage') setScreen('manage');
          if (value === 'updateAll') setScreen('updateAll');
          if (value === 'doctor') setScreen('doctor');
          if (value === 'about') setScreen('about');
          if (value === 'feedback') setScreen('feedback');
          if (value === 'exit') setScreen('exit');
        }}
      />
    );
  }

  if (screen === 'quick-provider') {
    return (
      <ProviderSelectScreen
        providers={providerList}
        onSelect={(value) => {
          const selected = providers.getProvider(value);
          const defaults = providerDefaults(value);
          const keyDefaults =
            value === 'zai' ? resolveZaiApiKey() : { value: '', detectedFrom: null, skipPrompt: false };
          const prefillModels = value === 'zai' || value === 'minimax';
          setProviderKey(value);
          setName(value === 'mirror' ? 'mclaude' : value);
          setBaseUrl(selected?.baseUrl || '');
          setApiKey(keyDefaults.value);
          setApiKeyDetectedFrom(keyDefaults.detectedFrom);
          setModelOpus(prefillModels ? String(selected?.env?.ANTHROPIC_DEFAULT_OPUS_MODEL ?? '').trim() : '');
          setModelSonnet(prefillModels ? String(selected?.env?.ANTHROPIC_DEFAULT_SONNET_MODEL ?? '').trim() : '');
          setModelHaiku(prefillModels ? String(selected?.env?.ANTHROPIC_DEFAULT_HAIKU_MODEL ?? '').trim() : '');
          setExtraEnv([]);
          setBrandKey('auto');
          setUsePromptPack(defaults.promptPack);
          setInstallSkill(defaults.skillInstall);
          setShellEnv(keyDefaults.detectedFrom === 'Z_AI_API_KEY' ? false : defaults.shellEnv);
          setScreen('quick-intro');
        }}
      />
    );
  }

  if (screen === 'quick-intro') {
    const keyDefaults = providerKey === 'zai' ? resolveZaiApiKey() : { skipPrompt: false };
    const shouldConfigureModels =
      Boolean(provider?.requiresModelMapping) || providerKey === 'zai' || providerKey === 'minimax';
    const skipApiKey = keyDefaults.skipPrompt || provider?.credentialOptional;
    return (
      <ProviderIntroScreen
        providerKey={providerKey || 'zai'}
        providerLabel={provider?.label || providerKey || 'Provider'}
        isQuickSetup={true}
        onContinue={() => {
          // CCRouter: go to URL config screen
          if (providerKey === 'ccrouter') {
            setScreen('quick-ccrouter-url');
          } else if (skipApiKey) {
            setScreen(shouldConfigureModels ? 'quick-models' : 'quick-name');
          } else {
            setScreen('quick-api-key');
          }
        }}
        onBack={() => setScreen('quick-provider')}
      />
    );
  }

  if (screen === 'quick-api-key') {
    const shouldConfigureModels =
      Boolean(provider?.requiresModelMapping) || providerKey === 'zai' || providerKey === 'minimax';
    return (
      <ApiKeyScreen
        providerLabel={provider?.label || 'Provider'}
        providerKey={providerKey || undefined}
        envVarName={provider?.authMode === 'authToken' ? 'ANTHROPIC_AUTH_TOKEN' : 'ANTHROPIC_API_KEY'}
        value={apiKey}
        onChange={setApiKey}
        onSubmit={() => setScreen(shouldConfigureModels ? 'quick-models' : 'quick-name')}
        detectedFrom={apiKeyDetectedFrom || undefined}
      />
    );
  }

  // Consolidated model mapping screen for quick setup
  if (screen === 'quick-models') {
    const skipApiKey = (providerKey === 'zai' && apiKeyDetectedFrom === 'Z_AI_API_KEY') || provider?.credentialOptional;
    return (
      <ModelConfigScreen
        title="Model Configuration"
        subtitle="Map Claude Code model aliases to your provider"
        providerKey={providerKey || undefined}
        opusValue={modelOpus}
        sonnetValue={modelSonnet}
        haikuValue={modelHaiku}
        onOpusChange={setModelOpus}
        onSonnetChange={setModelSonnet}
        onHaikuChange={setModelHaiku}
        onComplete={() => setScreen('quick-name')}
        onBack={() => setScreen(skipApiKey ? 'quick-intro' : 'quick-api-key')}
      />
    );
  }

  // CCRouter URL configuration (quick setup)
  if (screen === 'quick-ccrouter-url') {
    return (
      <RouterUrlScreen
        value={baseUrl || provider?.baseUrl || 'http://127.0.0.1:3456'}
        onChange={setBaseUrl}
        onSubmit={() => setScreen('quick-name')}
        onBack={() => setScreen('quick-intro')}
      />
    );
  }

  if (screen === 'quick-name') {
    return (
      <Frame>
        <Header title="Variant Name" subtitle="This becomes the CLI command name" />
        <Divider />
        {apiKeyDetectedFrom && (
          <Box marginTop={1}>
            <Text color={colors.success}>Detected API key from {apiKeyDetectedFrom}.</Text>
          </Box>
        )}
        <Box marginY={1}>
          <TextField
            label="Command name"
            value={name}
            onChange={setName}
            onSubmit={() => {
              setProgressLines([]);
              setScreen('create-running');
            }}
            placeholder={providerKey || 'my-variant'}
            hint="Press Enter to continue"
          />
        </Box>
        <Divider />
        <HintBar />
      </Frame>
    );
  }

  if (screen === 'create-provider') {
    return (
      <ProviderSelectScreen
        providers={providerList}
        onSelect={(value) => {
          const selected = providers.getProvider(value);
          const defaults = providerDefaults(value);
          const keyDefaults =
            value === 'zai' ? resolveZaiApiKey() : { value: '', detectedFrom: null, skipPrompt: false };
          const prefillModels = value === 'zai' || value === 'minimax';
          setProviderKey(value);
          setName(value === 'mirror' ? 'mclaude' : value);
          setBaseUrl(selected?.baseUrl || '');
          setApiKey(keyDefaults.value);
          setApiKeyDetectedFrom(keyDefaults.detectedFrom);
          setModelOpus(prefillModels ? String(selected?.env?.ANTHROPIC_DEFAULT_OPUS_MODEL ?? '').trim() : '');
          setModelSonnet(prefillModels ? String(selected?.env?.ANTHROPIC_DEFAULT_SONNET_MODEL ?? '').trim() : '');
          setModelHaiku(prefillModels ? String(selected?.env?.ANTHROPIC_DEFAULT_HAIKU_MODEL ?? '').trim() : '');
          setExtraEnv([]);
          setBrandKey('auto');
          setUsePromptPack(defaults.promptPack);
          setInstallSkill(defaults.skillInstall);
          setShellEnv(keyDefaults.detectedFrom === 'Z_AI_API_KEY' ? false : defaults.shellEnv);
          setScreen('create-intro');
        }}
      />
    );
  }

  if (screen === 'create-intro') {
    return (
      <ProviderIntroScreen
        providerKey={providerKey || 'zai'}
        providerLabel={provider?.label || providerKey || 'Provider'}
        isQuickSetup={false}
        onContinue={() => setScreen('create-brand')}
        onBack={() => setScreen('create-provider')}
      />
    );
  }

  if (screen === 'create-brand') {
    const items = [
      { label: 'Auto (match provider)', value: 'auto' },
      { label: 'None (keep default Claude Code look)', value: 'none' },
      ...brandList.map((brand) => ({
        label: `${brand.label} - ${brand.description}`,
        value: brand.key,
      })),
    ];
    return (
      <Frame>
        <Header title="Choose Theme" subtitle="Optional: re-skin the UI with presets" />
        <Divider />
        <Box flexDirection="column" marginY={1}>
          <SelectInput
            items={items}
            onSelect={(item) => {
              setBrandKey(item.value as string);
              setScreen('create-name');
            }}
          />
        </Box>
        <Divider />
        <HintBar hints={['Pick a style preset or press Esc to go back']} />
      </Frame>
    );
  }

  if (screen === 'create-name') {
    // CCRouter goes to its own URL config screen, mirror skips base URL entirely
    const getNextScreen = () => {
      if (providerKey === 'ccrouter') return 'create-ccrouter-url';
      if (providerKey === 'mirror') return 'create-skill-install'; // Mirror: skip base URL and API key
      return 'create-base-url';
    };
    const nextScreen = getNextScreen();
    return (
      <Frame>
        <Header title="Variant Name" subtitle="This becomes the CLI command name" />
        <Divider />
        <Box marginY={1}>
          <TextField
            label="Command name"
            value={name}
            onChange={setName}
            onSubmit={() => setScreen(nextScreen)}
            placeholder={providerKey || 'my-variant'}
            hint="Press Enter to continue"
          />
        </Box>
        <Divider />
        <HintBar />
      </Frame>
    );
  }

  // CCRouter URL configuration (full create flow)
  if (screen === 'create-ccrouter-url') {
    return (
      <RouterUrlScreen
        value={baseUrl || provider?.baseUrl || 'http://127.0.0.1:3456'}
        onChange={setBaseUrl}
        onSubmit={() => setScreen('create-skill-install')}
        onBack={() => setScreen('create-name')}
      />
    );
  }

  if (screen === 'create-base-url') {
    // Skip API key for: zai with detected key, or any provider with credentialOptional
    const skipApiKey = (providerKey === 'zai' && apiKeyDetectedFrom === 'Z_AI_API_KEY') || provider?.credentialOptional;
    const shouldConfigureModels =
      Boolean(provider?.requiresModelMapping) || providerKey === 'zai' || providerKey === 'minimax';
    // promptPackMode is deprecated - skip mode selection, go directly to skill-install
    const nextScreen = 'create-skill-install';
    return (
      <Frame>
        <Header title="Base URL" subtitle="Custom API endpoint (optional)" />
        <Divider />
        <Box marginY={1}>
          <TextField
            label="ANTHROPIC_BASE_URL"
            value={baseUrl}
            onChange={setBaseUrl}
            onSubmit={() =>
              setScreen(skipApiKey ? (shouldConfigureModels ? 'create-models' : nextScreen) : 'create-api-key')
            }
            placeholder={provider?.baseUrl || 'Leave blank for defaults'}
            hint="Leave blank to keep provider defaults"
          />
        </Box>
        <Divider />
        <HintBar />
      </Frame>
    );
  }

  if (screen === 'create-api-key') {
    // promptPackMode is deprecated - skip mode selection, go directly to skill-install
    const nextScreen = 'create-skill-install';
    const shouldConfigureModels =
      Boolean(provider?.requiresModelMapping) || providerKey === 'zai' || providerKey === 'minimax';
    return (
      <ApiKeyScreen
        providerLabel={provider?.label || 'Provider'}
        providerKey={providerKey || undefined}
        envVarName={provider?.authMode === 'authToken' ? 'ANTHROPIC_AUTH_TOKEN' : 'ANTHROPIC_API_KEY'}
        value={apiKey}
        onChange={setApiKey}
        onSubmit={() => setScreen(shouldConfigureModels ? 'create-models' : nextScreen)}
        detectedFrom={apiKeyDetectedFrom || undefined}
      />
    );
  }

  // Consolidated model mapping screen for create flow
  if (screen === 'create-models') {
    // promptPackMode is deprecated - skip mode selection, go directly to skill-install
    const nextScreen = 'create-skill-install';
    const backScreen =
      (providerKey === 'zai' && apiKeyDetectedFrom === 'Z_AI_API_KEY') || provider?.credentialOptional
        ? 'create-base-url'
        : 'create-api-key';
    return (
      <ModelConfigScreen
        title="Model Configuration"
        subtitle="Map Claude Code model aliases to your provider"
        providerKey={providerKey || undefined}
        opusValue={modelOpus}
        sonnetValue={modelSonnet}
        haikuValue={modelHaiku}
        onOpusChange={setModelOpus}
        onSonnetChange={setModelSonnet}
        onHaikuChange={setModelHaiku}
        onComplete={() => setScreen(nextScreen)}
        onBack={() => setScreen(backScreen)}
      />
    );
  }

  if (screen === 'create-prompt-pack') {
    return (
      <Frame>
        <Header title="Prompt Pack" subtitle="Provider hints for tools and behavior" />
        <Divider />
        <YesNoSelect
          title="Apply provider prompt pack?"
          onSelect={(value) => {
            setUsePromptPack(value);
            // promptPackMode is deprecated - go directly to skill-install
            setScreen('create-skill-install');
          }}
        />
        <Divider />
        <HintBar />
      </Frame>
    );
  }

  // NOTE: create-prompt-pack-mode screen removed - promptPackMode is deprecated

  if (screen === 'create-skill-install') {
    return (
      <Frame>
        <Header title="Browser Automation" subtitle="Navigate, fill forms, screenshot, scrape" />
        <Divider />
        <Box marginY={1} flexDirection="column">
          <Text color={colors.textMuted}>The dev-browser skill adds browser automation to your variant.</Text>
          <Text color={colors.primaryBright}>https://github.com/SawyerHood/dev-browser</Text>
        </Box>
        <YesNoSelect
          title="Install dev-browser skill?"
          onSelect={(value) => {
            setInstallSkill(value);
            if (providerKey === 'zai') {
              if (apiKeyDetectedFrom === 'Z_AI_API_KEY') {
                setShellEnv(false);
                setScreen('create-env-confirm');
              } else {
                setScreen('create-shell-env');
              }
            } else {
              setScreen('create-env-confirm');
            }
          }}
        />
        <Divider />
        <HintBar />
      </Frame>
    );
  }

  if (screen === 'create-shell-env') {
    return (
      <Frame>
        <Header title="Shell Environment" subtitle="Write API key to your shell profile" />
        <Divider />
        <YesNoSelect
          title="Write Z_AI_API_KEY to your shell profile?"
          onSelect={(value) => {
            setShellEnv(value);
            setScreen('create-env-confirm');
          }}
        />
        <Divider />
        <HintBar />
      </Frame>
    );
  }

  if (screen === 'create-env-confirm') {
    return (
      <Frame>
        <Header title="Custom Environment" subtitle="Optional extras beyond the template" />
        <Divider />
        <YesNoSelect
          title="Add custom env entries?"
          defaultNo
          onSelect={(value) => {
            if (value) {
              setScreen('create-env-add');
            } else {
              setScreen('create-summary');
            }
          }}
        />
        <Divider />
        <HintBar />
      </Frame>
    );
  }

  if (screen === 'create-env-add') {
    return (
      <EnvEditorScreen
        envEntries={extraEnv}
        onAdd={(entry) => setExtraEnv((prev) => [...prev, entry])}
        onDone={() => setScreen('create-summary')}
      />
    );
  }

  if (screen === 'create-summary') {
    const providerLabel = provider?.label || providerKey || '';
    const brandPreset = brandList.find((item) => item.key === brandKey);
    const brandLabel =
      brandKey === 'auto' ? 'Auto (match provider)' : brandKey === 'none' ? 'None' : brandPreset?.label || brandKey;
    return (
      <SummaryScreen
        data={{
          name,
          providerLabel,
          providerKey: providerKey || undefined,
          brandLabel,
          baseUrl: effectiveBaseUrl,
          apiKey,
          apiKeySource: apiKeyDetectedFrom || undefined,
          modelSonnet: modelOverrides.sonnet,
          modelOpus: modelOverrides.opus,
          modelHaiku: modelOverrides.haiku,
          rootDir,
          binDir,
          claudeVersion,
          usePromptPack,
          promptPackMode,
          installSkill,
          shellEnv,
        }}
        onConfirm={() => {
          setProgressLines([]);
          setScreen('create-running');
        }}
        onBack={() => setScreen('create-env-confirm')}
        onCancel={() => setScreen('home')}
      />
    );
  }

  if (screen === 'create-running') {
    return <ProgressScreen title="Creating variant" lines={progressLines} variantName={name} />;
  }

  if (screen === 'create-done') {
    return (
      <CompletionScreen
        title="Create variant"
        lines={doneLines}
        variantName={name}
        wrapperPath={getWrapperPath(binDir, name)}
        configPath={`${rootDir}/${name}/config`}
        variantPath={`${rootDir}/${name}`}
        summary={completionSummary}
        nextSteps={completionNextSteps}
        help={completionHelp}
        onDone={(value) => {
          if (value === 'home') setScreen('home');
          else setScreen('exit');
        }}
      />
    );
  }

  if (screen === 'manage') {
    return (
      <VariantListScreen
        variants={variants.map((v) => ({
          name: v.name,
          provider: v.meta?.provider,
          wrapperPath: getWrapperPath(binDir, v.name),
        }))}
        onSelect={(variantName) => {
          const entry = variants.find((item) => item.name === variantName);
          if (!entry || !entry.meta) return;
          setSelectedVariant({ ...entry.meta, wrapperPath: getWrapperPath(binDir, entry.name) });
          setScreen('manage-actions');
        }}
        onBack={() => setScreen('home')}
      />
    );
  }

  if (screen === 'manage-actions' && selectedVariant) {
    return (
      <VariantActionsScreen
        meta={selectedVariant}
        onUpdate={() => setScreen('manage-update')}
        onConfigureModels={() => {
          const settingsPath = `${selectedVariant.configDir}/settings.json`;
          const providerEnv = selectedVariant.provider
            ? providers.getProvider(selectedVariant.provider)?.env
            : undefined;

          let env: Record<string, unknown> = {};
          try {
            const raw = fs.readFileSync(settingsPath, 'utf8');
            const parsed = JSON.parse(raw) as { env?: Record<string, unknown> };
            env = parsed.env ?? {};
          } catch {
            // If settings.json doesn't exist yet (or is malformed), fall back to provider defaults.
          }

          const toStringOrEmpty = (value: unknown) =>
            typeof value === 'string' || typeof value === 'number' ? String(value).trim() : '';

          const readModel = (key: string) =>
            toStringOrEmpty(env[key]) || toStringOrEmpty(providerEnv ? providerEnv[key] : undefined);

          // Prefill with existing settings (or provider defaults) so users can edit in-place.
          setModelOpus(readModel('ANTHROPIC_DEFAULT_OPUS_MODEL'));
          setModelSonnet(readModel('ANTHROPIC_DEFAULT_SONNET_MODEL'));
          setModelHaiku(readModel('ANTHROPIC_DEFAULT_HAIKU_MODEL'));
          setScreen('manage-models');
        }}
        onRemove={() => setScreen('manage-remove')}
        onBack={() => setScreen('manage')}
      />
    );
  }

  if (screen === 'manage-update' && selectedVariant) {
    return <ProgressScreen title="Updating variant" lines={progressLines} />;
  }

  if (screen === 'manage-update-done') {
    return (
      <CompletionScreen
        title="Update variant"
        lines={doneLines}
        summary={completionSummary}
        nextSteps={completionNextSteps}
        help={completionHelp}
        onDone={(value) => {
          if (value === 'home') setScreen('home');
          else setScreen('exit');
        }}
      />
    );
  }

  // Consolidated model configuration screen for existing variants
  if (screen === 'manage-models' && selectedVariant) {
    return (
      <ModelConfigScreen
        title="Configure Models"
        subtitle={`Update model mapping for ${selectedVariant.name}`}
        providerKey={selectedVariant.provider}
        opusValue={modelOpus}
        sonnetValue={modelSonnet}
        haikuValue={modelHaiku}
        onOpusChange={setModelOpus}
        onSonnetChange={setModelSonnet}
        onHaikuChange={setModelHaiku}
        onComplete={() => setScreen('manage-models-saving')}
        onBack={() => setScreen('manage-actions')}
      />
    );
  }

  if (screen === 'manage-models-saving' && selectedVariant) {
    return <ProgressScreen title="Saving model configuration" lines={progressLines} />;
  }

  if (screen === 'manage-models-done') {
    return (
      <CompletionScreen
        title="Models Updated"
        lines={doneLines}
        summary={completionSummary}
        nextSteps={completionNextSteps}
        help={completionHelp}
        onDone={(value) => {
          if (value === 'home') setScreen('home');
          else setScreen('manage-actions');
        }}
      />
    );
  }

  if (screen === 'manage-remove' && selectedVariant) {
    return (
      <Frame borderColor={colors.warning}>
        <Header title="Remove Variant" subtitle={`This will delete ${selectedVariant.name} from ${rootDir}`} />
        <Divider />
        <Box flexDirection="column" marginY={1}>
          <SelectInput
            items={[
              { label: 'Remove', value: 'remove' },
              { label: 'Cancel', value: 'cancel' },
            ]}
            onSelect={(item) => {
              if (item.value === 'remove') {
                try {
                  core.removeVariant(rootDir, selectedVariant.name);
                  setCompletionSummary([`Removed ${selectedVariant.name}`]);
                  setCompletionNextSteps([
                    'Use "Create" to make a new variant',
                    'Run "List" to see remaining variants',
                  ]);
                  setCompletionHelp(['Help: cc-mirror help', 'List: cc-mirror list']);
                  setDoneLines([`Removed ${selectedVariant.name}`]);
                } catch (error) {
                  const message = error instanceof Error ? error.message : String(error);
                  setDoneLines([`Failed: ${message}`]);
                  setCompletionSummary([]);
                  setCompletionNextSteps([]);
                  setCompletionHelp([]);
                }
                setScreen('manage-remove-done');
              } else {
                setScreen('manage-actions');
              }
            }}
          />
        </Box>
        <Divider />
        <HintBar hints={['Confirm removal or press Cancel']} />
      </Frame>
    );
  }

  if (screen === 'manage-remove-done') {
    return (
      <CompletionScreen
        title="Remove variant"
        lines={doneLines}
        summary={completionSummary}
        nextSteps={completionNextSteps}
        help={completionHelp}
        onDone={(value) => {
          if (value === 'home') setScreen('home');
          else setScreen('exit');
        }}
      />
    );
  }

  if (screen === 'updateAll') {
    return <ProgressScreen title="Updating all variants" lines={progressLines} />;
  }

  if (screen === 'updateAll-done') {
    return (
      <CompletionScreen
        title="Update all"
        lines={doneLines}
        summary={completionSummary}
        nextSteps={completionNextSteps}
        help={completionHelp}
        onDone={(value) => {
          if (value === 'home') setScreen('home');
          else setScreen('exit');
        }}
      />
    );
  }

  if (screen === 'doctor') {
    return <DiagnosticsScreen report={doctorReport} onDone={() => setScreen('home')} />;
  }

  if (screen === 'about') {
    return <AboutScreen onBack={() => setScreen('home')} />;
  }

  if (screen === 'feedback') {
    return <FeedbackScreen onBack={() => setScreen('home')} />;
  }

  return (
    <Frame>
      <Header title="CC-MIRROR" subtitle="Unknown state" />
    </Frame>
  );
};
