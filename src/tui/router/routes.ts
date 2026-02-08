/**
 * Route Definitions
 * Maps screen names to route metadata
 */

import type { Screen } from '../state/types.js';

export interface RouteDefinition {
  screen: Screen;
  flow: 'home' | 'quick' | 'create' | 'manage' | 'updateAll' | 'settings' | 'doctor' | 'exit';
  parent?: Screen;
}

/**
 * Route definitions for all screens
 * Used for navigation and back button logic
 */
export const routes: Record<Screen, RouteDefinition> = {
  // Home and exit
  home: { screen: 'home', flow: 'home' },
  exit: { screen: 'exit', flow: 'exit' },

  // Quick setup flow
  'quick-provider': { screen: 'quick-provider', flow: 'quick', parent: 'home' },
  'quick-api-key': { screen: 'quick-api-key', flow: 'quick', parent: 'quick-provider' },
  'quick-model-opus': { screen: 'quick-model-opus', flow: 'quick', parent: 'quick-api-key' },
  'quick-model-sonnet': { screen: 'quick-model-sonnet', flow: 'quick', parent: 'quick-model-opus' },
  'quick-model-haiku': { screen: 'quick-model-haiku', flow: 'quick', parent: 'quick-model-sonnet' },
  'quick-name': { screen: 'quick-name', flow: 'quick', parent: 'quick-model-haiku' },

  // Advanced create flow
  'create-provider': { screen: 'create-provider', flow: 'create', parent: 'home' },
  'create-brand': { screen: 'create-brand', flow: 'create', parent: 'create-provider' },
  'create-name': { screen: 'create-name', flow: 'create', parent: 'create-brand' },
  'create-base-url': { screen: 'create-base-url', flow: 'create', parent: 'create-name' },
  'create-api-key': { screen: 'create-api-key', flow: 'create', parent: 'create-base-url' },
  'create-model-opus': { screen: 'create-model-opus', flow: 'create', parent: 'create-api-key' },
  'create-model-sonnet': { screen: 'create-model-sonnet', flow: 'create', parent: 'create-model-opus' },
  'create-model-haiku': { screen: 'create-model-haiku', flow: 'create', parent: 'create-model-sonnet' },
  'create-prompt-pack': { screen: 'create-prompt-pack', flow: 'create', parent: 'create-model-haiku' },
  // 'create-prompt-pack-mode' removed - promptPackMode is deprecated
  'create-skill-install': { screen: 'create-skill-install', flow: 'create', parent: 'create-prompt-pack' },
  'create-shell-env': { screen: 'create-shell-env', flow: 'create', parent: 'create-skill-install' },
  'create-env-confirm': { screen: 'create-env-confirm', flow: 'create', parent: 'create-shell-env' },
  'create-env-add': { screen: 'create-env-add', flow: 'create', parent: 'create-env-confirm' },
  'create-summary': { screen: 'create-summary', flow: 'create', parent: 'create-env-add' },
  'create-running': { screen: 'create-running', flow: 'create', parent: 'create-summary' },
  'create-done': { screen: 'create-done', flow: 'create', parent: 'home' },

  // Manage flow
  manage: { screen: 'manage', flow: 'manage', parent: 'home' },
  'manage-actions': { screen: 'manage-actions', flow: 'manage', parent: 'manage' },
  'manage-update': { screen: 'manage-update', flow: 'manage', parent: 'manage-actions' },
  'manage-update-done': { screen: 'manage-update-done', flow: 'manage', parent: 'home' },
  'manage-remove': { screen: 'manage-remove', flow: 'manage', parent: 'manage-actions' },
  'manage-remove-done': { screen: 'manage-remove-done', flow: 'manage', parent: 'home' },
  'manage-models-opus': { screen: 'manage-models-opus', flow: 'manage', parent: 'manage-actions' },
  'manage-models-sonnet': { screen: 'manage-models-sonnet', flow: 'manage', parent: 'manage-models-opus' },
  'manage-models-haiku': { screen: 'manage-models-haiku', flow: 'manage', parent: 'manage-models-sonnet' },
  'manage-models-saving': { screen: 'manage-models-saving', flow: 'manage', parent: 'manage-models-haiku' },
  'manage-models-done': { screen: 'manage-models-done', flow: 'manage', parent: 'manage-actions' },

  // Update all
  updateAll: { screen: 'updateAll', flow: 'updateAll', parent: 'home' },
  'updateAll-done': { screen: 'updateAll-done', flow: 'updateAll', parent: 'home' },

  // Settings
  'settings-root': { screen: 'settings-root', flow: 'settings', parent: 'home' },
  'settings-bin': { screen: 'settings-bin', flow: 'settings', parent: 'settings-root' },

  // Doctor
  doctor: { screen: 'doctor', flow: 'doctor', parent: 'home' },
};

/**
 * Get the parent screen for navigation
 */
export function getParentScreen(screen: Screen): Screen {
  const route = routes[screen];
  return route?.parent ?? 'home';
}

/**
 * Get the flow for a screen
 */
export function getScreenFlow(screen: Screen): string {
  return routes[screen]?.flow ?? 'home';
}
