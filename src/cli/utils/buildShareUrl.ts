/**
 * Build a share URL for Twitter/X
 */

export function buildShareUrl(providerLabel: string, variant: string, mode?: 'minimal' | 'maximal'): string {
  const lines = [
    `Just set up ${providerLabel} with claude-sneakpeek`,
    mode ? `Prompt pack: ${mode}` : 'Prompt pack: enabled',
    `CLI: ${variant}`,
    'Get yours: npx claude-sneakpeek',
    '(Attach your TUI screenshot)',
  ];
  const url = new URL('https://x.com/intent/tweet');
  url.searchParams.set('text', lines.join('\n'));
  return url.toString();
}
