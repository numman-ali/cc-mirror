import type { OverlayKey } from './types.js';

export const OVERLAY_MARKERS = {
  start: '<!-- claude-sneakpeek:provider-overlay start -->',
  end: '<!-- claude-sneakpeek:provider-overlay end -->',
};

export type OverlayTarget = {
  key: OverlayKey;
  filename: string;
};

export const PROMPT_PACK_TARGETS: OverlayTarget[] = [
  { key: 'main', filename: 'system-prompt-main-system-prompt.md' },
  { key: 'mcpCli', filename: 'system-prompt-mcp-cli.md' },
  { key: 'bash', filename: 'tool-description-bash.md' },
  { key: 'webfetch', filename: 'tool-description-webfetch.md' },
  { key: 'websearch', filename: 'tool-description-websearch.md' },
  { key: 'mcpsearch', filename: 'tool-description-mcpsearch.md' },
  { key: 'mcpsearch', filename: 'tool-description-mcpsearch-with-available-tools.md' },
  { key: 'explore', filename: 'agent-prompt-explore.md' },
  { key: 'planEnhanced', filename: 'agent-prompt-plan-mode-enhanced.md' },
  { key: 'taskAgent', filename: 'agent-prompt-task-tool.md' },
  { key: 'planReminder', filename: 'system-reminder-plan-mode-is-active.md' },
  { key: 'planReminderSub', filename: 'system-reminder-plan-mode-is-active-for-subagents.md' },
  { key: 'taskTool', filename: 'tool-description-task.md' },
  { key: 'enterPlan', filename: 'tool-description-enterplanmode.md' },
  { key: 'exitPlan', filename: 'tool-description-exitplanmode-v2.md' },
  { key: 'skill', filename: 'tool-description-skill.md' },
  { key: 'conversationSummary', filename: 'agent-prompt-conversation-summarization.md' },
  {
    key: 'conversationSummaryExtended',
    filename: 'agent-prompt-conversation-summarization-with-additional-instructions.md',
  },
  { key: 'webfetchSummary', filename: 'agent-prompt-webfetch-summarizer.md' },
];
