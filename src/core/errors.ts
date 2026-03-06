export const isTweakccNativeExtractionFailure = (text: string) => {
  const normalized = text.toLowerCase();
  return (
    normalized.includes('could not extract js from native binary') ||
    normalized.includes('failed to extract claude.js from native installation') ||
    normalized.includes('failed to extract javascript from native installation')
  );
};

const extractErrorHint = (text: string) => {
  const normalized = text.toLowerCase();
  if (isTweakccNativeExtractionFailure(text)) {
    return 'tweakcc could not extract JS from the native Claude Code binary. This usually means the pinned tweakcc/native extractor (often node-lief) cannot read this Claude Code release yet. Re-run with --no-tweak to skip theming, or update cc-mirror/tweakcc to a version that supports this binary.';
  }
  if (normalized.includes('node-lief')) {
    return 'tweakcc requires native extraction support such as node-lief to patch native Claude Code binaries. If that extractor cannot be installed or loaded on your system, re-run with --no-tweak to skip theming.';
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
