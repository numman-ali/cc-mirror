import type { MiscConfig } from './types.js';

export const BRAND_MISC_DEFAULTS: MiscConfig = {
  showTweakccVersion: false,
  showPatchesApplied: false,
  expandThinkingBlocks: true,
  enableConversationTitle: true,
  hideStartupBanner: true,
  hideCtrlGToEdit: true,
  hideStartupClawd: true,
  increaseFileReadLimit: true,
  suppressLineNumbers: true,
  suppressRateLimitOptions: false,
  mcpConnectionNonBlocking: false,
  mcpServerBatchSize: null,
  statuslineThrottleMs: null,
  statuslineUseFixedInterval: false,
  tableFormat: 'default',
  enableSwarmMode: false,
  enableSessionMemory: false,
  enableRememberSkill: false,
  tokenCountRounding: null,
  autoAcceptPlanMode: false,
  allowBypassPermissionsInSudo: false,
  suppressNativeInstallerWarning: true,
  filterScrollEscapeSequences: false,
};

export const buildBrandMiscConfig = (overrides: Partial<MiscConfig> = {}): MiscConfig => ({
  ...BRAND_MISC_DEFAULTS,
  ...overrides,
});
