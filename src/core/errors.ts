const extractErrorHint = (text: string) => {
  const normalized = text.toLowerCase();
  if (normalized.includes('could not extract js from native binary')) {
    return 'tweakcc could not extract JS from the native Claude Code binary. This usually means node-lief is unavailable on your system. Re-run with --no-tweak to skip theming, or follow tweakcc native-install docs to enable native patching.';
  }
  if (normalized.includes('node-lief')) {
    return 'tweakcc requires node-lief to patch native Claude Code binaries. If node-lief cannot be installed on your system, re-run with --no-tweak to skip theming.';
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
