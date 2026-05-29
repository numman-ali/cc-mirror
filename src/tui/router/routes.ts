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
  'quick-intro': { screen: 'quick-intro', flow: 'quick', parent: 'quick-provider' },
  'quick-ccrouter-url': { screen: 'quick-ccrouter-url', flow: 'quick', parent: 'quick-intro' },
  'quick-api-key': { screen: 'quick-api-key', flow: 'quick', parent: 'quick-intro' },
  'quick-models': { screen: 'quick-models', flow: 'quick', parent: 'quick-api-key' },
  'quick-name': { screen: 'quick-name', flow: 'quick', parent: 'quick-models' },
  'quick-review': { screen: 'quick-review', flow: 'quick', parent: 'quick-name' },

  // Advanced create flow
  'create-provider': { screen: 'create-provider', flow: 'create', parent: 'home' },
  'create-intro': { screen: 'create-intro', flow: 'create', parent: 'create-provider' },
  'create-brand': { screen: 'create-brand', flow: 'create', parent: 'create-intro' },
  'create-name': { screen: 'create-name', flow: 'create', parent: 'create-brand' },
  'create-ccrouter-url': { screen: 'create-ccrouter-url', flow: 'create', parent: 'create-name' },
  'create-base-url': { screen: 'create-base-url', flow: 'create', parent: 'create-name' },
  'create-api-key': { screen: 'create-api-key', flow: 'create', parent: 'create-base-url' },
  'create-models': { screen: 'create-models', flow: 'create', parent: 'create-api-key' },
  'create-prompt-pack': { screen: 'create-prompt-pack', flow: 'create', parent: 'create-models' },
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
  'manage-models': { screen: 'manage-models', flow: 'manage', parent: 'manage-actions' },
  'manage-models-saving': { screen: 'manage-models-saving', flow: 'manage', parent: 'manage-models' },
  'manage-models-done': { screen: 'manage-models-done', flow: 'manage', parent: 'manage-actions' },

  // Update all
  updateAll: { screen: 'updateAll', flow: 'updateAll', parent: 'home' },
  'updateAll-done': { screen: 'updateAll-done', flow: 'updateAll', parent: 'home' },

  // Settings
  'settings-root': { screen: 'settings-root', flow: 'settings', parent: 'home' },
  'settings-bin': { screen: 'settings-bin', flow: 'settings', parent: 'settings-root' },

  // Doctor
  doctor: { screen: 'doctor', flow: 'doctor', parent: 'home' },

  // Content
  about: { screen: 'about', flow: 'home', parent: 'home' },
  feedback: { screen: 'feedback', flow: 'home', parent: 'home' },
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
