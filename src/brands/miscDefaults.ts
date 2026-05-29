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
  mcpConnectionNonBlocking: true,
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
  enableWorktreeMode: true,
  allowCustomAgentModels: true,
  enableContextLimitOverride: false,
  enableModelCustomizations: false,
  enableVoiceMode: false,
  enableVoiceConciseOutput: true,
  enableChannelsMode: false,
};

export const buildBrandMiscConfig = (overrides: Partial<MiscConfig> = {}): MiscConfig => ({
  ...BRAND_MISC_DEFAULTS,
  ...overrides,
});
