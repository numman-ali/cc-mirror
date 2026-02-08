/**
 * Escape Key Navigation Hook
 * Handles ESC key to navigate back through screen hierarchy
 */

import { useInput } from 'ink';
import type { Screen } from '../state/types.js';
import type { ProviderTemplate } from '../../providers/index.js';

export interface UseEscapeNavigationOptions {
  screen: Screen;
  provider: ProviderTemplate | null;
  setScreen: (screen: Screen) => void;
}

/**
 * Hook that handles ESC key navigation
 * Provides context-aware back navigation
 */
export function useEscapeNavigation(options: UseEscapeNavigationOptions): void {
  const { screen, provider, setScreen } = options;

  useInput((input, key) => {
    if (key.escape) {
      navigateBack(screen, provider, setScreen);
    }
  });
}

/**
 * Navigate back based on current screen
 */
function navigateBack(screen: Screen, provider: ProviderTemplate | null, setScreen: (screen: Screen) => void): void {
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
      // Context-aware: go back to model-haiku if provider requires models
      setScreen(provider?.requiresModelMapping ? 'quick-model-haiku' : 'quick-api-key');
      break;
    case 'quick-provider':
      setScreen('home');
      break;

    // Create flow - model screens
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
}
