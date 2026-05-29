/**
 * Escape Key Navigation Hook
 * Handles ESC key to navigate back through screen hierarchy
 */

import { useInput } from 'ink';
import type { Screen } from '../state/types.js';
import type { ProviderTemplate } from '../../providers/index.js';
import {
  getTuiProviderCapabilities,
  shouldPromptForCredential,
  shouldShowModelSetup,
} from '../providerCapabilities.js';

export interface UseEscapeNavigationOptions {
  screen: Screen;
  provider: ProviderTemplate | null;
  apiKeyDetectedFrom?: string | null;
  setScreen: (screen: Screen) => void;
}

/**
 * Hook that handles ESC key navigation
 * Provides context-aware back navigation
 */
export function useEscapeNavigation(options: UseEscapeNavigationOptions): void {
  const { screen, provider, apiKeyDetectedFrom, setScreen } = options;

  useInput((input, key) => {
    if (key.escape) {
      navigateBack(screen, provider, apiKeyDetectedFrom, setScreen);
    }
  });
}

/**
 * Navigate back based on current screen
 */
function navigateBack(
  screen: Screen,
  provider: ProviderTemplate | null,
  apiKeyDetectedFrom: string | null | undefined,
  setScreen: (screen: Screen) => void
): void {
  const capabilities = getTuiProviderCapabilities(provider?.key || 'custom', provider);

  switch (screen) {
    case 'home':
      setScreen('exit');
      break;

    // Quick setup flow - back steps
    case 'quick-api-key':
      setScreen('quick-intro');
      break;
    case 'quick-intro':
      setScreen('quick-provider');
      break;
    case 'quick-ccrouter-url':
      setScreen('quick-intro');
      break;
    case 'quick-models':
      setScreen(shouldPromptForCredential(capabilities, apiKeyDetectedFrom) ? 'quick-api-key' : 'quick-intro');
      break;
    case 'quick-name':
      if (capabilities.endpoint.kind === 'router-url') {
        setScreen('quick-ccrouter-url');
      } else if (shouldShowModelSetup(capabilities)) {
        setScreen('quick-models');
      } else {
        setScreen(shouldPromptForCredential(capabilities, apiKeyDetectedFrom) ? 'quick-api-key' : 'quick-intro');
      }
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
      setScreen('create-name');
      break;
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
}
