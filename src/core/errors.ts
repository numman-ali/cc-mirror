const extractErrorHint = (text: string) => {
  const normalized = text.toLowerCase();
  if (normalized.includes('could not extract js from native binary')) {
    return 'tweakcc reported a native Claude Code binary. claude-sneakpeek uses npm installs only; update or recreate the variant, or run with --no-tweak.';
  }
  if (normalized.includes('node-lief')) {
    return 'tweakcc requires node-lief for native Claude Code binaries. claude-sneakpeek uses npm installs only; update or recreate the variant, or run with --no-tweak.';
  }
  return null;
};

export const formatTweakccFailure = (output: string) => {
  const hint = extractErrorHint(output);
  if (hint) return hint;

  const lines = output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length === 0) return 'tweakcc failed.';

  const errorLine = lines.find((line) => line.toLowerCase().startsWith('error:'));
  if (errorLine) return errorLine;

  const tail = lines.slice(-3).join(' | ');
  return tail.length > 0 ? tail : 'tweakcc failed.';
};
