export interface Theme {
  name: string;
  id: string;
  colors: Record<string, string>;
}

export interface ThinkingVerbsConfig {
  format: string;
  verbs: string[];
}

export interface ThinkingStyleConfig {
  reverseMirror: boolean;
  updateInterval: number;
  phases: string[];
}

export type UserMessageBorderStyle =
  | 'none'
  | 'single'
  | 'double'
  | 'round'
  | 'bold'
  | 'singleDouble'
  | 'doubleSingle'
  | 'classic'
  | 'topBottomSingle'
  | 'topBottomDouble'
  | 'topBottomBold';

export interface UserMessageDisplayConfig {
  format: string;
  styling: string[];
  foregroundColor: string | 'default';
  backgroundColor: string | 'default' | null;
  borderStyle: UserMessageBorderStyle;
  borderColor: string;
  paddingX: number;
  paddingY: number;
  fitBoxToContent: boolean;
}

export interface InputBoxConfig {
  removeBorder: boolean;
}

export type TableFormat = 'default' | 'ascii' | 'clean' | 'clean-top-bottom';

export interface MiscConfig {
  showTweakccVersion: boolean;
  showPatchesApplied: boolean;
  expandThinkingBlocks: boolean;
  enableConversationTitle: boolean;
  hideStartupBanner: boolean;
  hideCtrlGToEdit: boolean;
  hideStartupClawd: boolean;
  increaseFileReadLimit: boolean;
  suppressLineNumbers: boolean;
  suppressRateLimitOptions: boolean;
  mcpConnectionNonBlocking: boolean;
  mcpServerBatchSize: number | null;
  statuslineThrottleMs: number | null;
  statuslineUseFixedInterval: boolean;
  tableFormat: TableFormat;
  enableSwarmMode: boolean;
  enableSessionMemory: boolean;
  enableRememberSkill: boolean;
  tokenCountRounding: number | null;
  autoAcceptPlanMode: boolean;
  allowBypassPermissionsInSudo: boolean | null;
  suppressNativeInstallerWarning: boolean;
  filterScrollEscapeSequences: boolean;
}

export interface TweakccSettings {
  themes: Theme[];
  thinkingVerbs: ThinkingVerbsConfig;
  thinkingStyle: ThinkingStyleConfig;
  userMessageDisplay: UserMessageDisplayConfig;
  inputBox: InputBoxConfig;
  misc: MiscConfig;
  claudeMdAltNames: string[] | null;
}

export interface TweakccConfig {
  ccVersion: string;
  ccInstallationPath: string | null;
  lastModified: string;
  changesApplied: boolean;
  settings: TweakccSettings;
  hidePiebaldAnnouncement?: boolean;
}
