/**
 * Prompt overlay patcher for the bundled Claude Code cli.js.
 *
 * Replaces cc-mirror's previous tweakDir/system-prompts/<key>.md file roundtrip
 * with a direct splice into the JS source. For each OverlayKey we know how to
 * patch, we anchor on a unique tail substring of the prompt's last literal
 * piece (sourced from tweakcc's repos/tweakcc/data/prompts/prompts-<ver>.json
 * catalog and adapted under MIT). The overlay block lives BETWEEN the tail
 * anchor and the next chunk of prompt text - which is the closing string
 * delimiter for prompts whose last piece runs to end-of-string.
 *
 * Re-application semantics match the old applyPromptPack: if our markers are
 * already present in the JS, replace the existing block; otherwise insert a
 * fresh block.
 *
 * Anchor coverage starts at the eight overlay keys that today's prompt-pack
 * actually patches successfully (verified against ~/.cc-mirror's extracted
 * system-prompts/ directory). The other OverlayKeys silently no-op, matching
 * pre-Phase-2 behaviour.
 */

import type { OverlayKey, OverlayMap } from '../prompt-pack/types.js';

export const OVERLAY_MARKERS = {
  start: '<!-- cc-mirror:provider-overlay start -->',
  end: '<!-- cc-mirror:provider-overlay end -->',
};

interface AnchorSpec {
  /**
   * A literal substring near the end of the prompt's last piece. Must be unique
   * in the bundled JS and stable across minor Claude Code updates. Sourced from
   * repos/tweakcc/data/prompts/prompts-<ver>.json (.prompts[].pieces[-1] tail).
   */
  tail: string;
}

const ANCHORS: Partial<Record<OverlayKey, AnchorSpec>> = {
  webfetch: {
    tail: '- For GitHub URLs, prefer using the gh CLI via Bash instead (e.g., gh pr view, gh issue view, gh api).',
  },
  websearch: {
    tail: 'Example: If the user asks for "latest React docs", search for "React documentation" with the current year, NOT last year',
  },
  explore: {
    tail: "Complete the user's search request efficiently and report your findings clearly.",
  },
  planEnhanced: {
    tail: 'REMEMBER: You can ONLY explore and plan. You CANNOT and MUST NOT write, edit, or modify any files. You do NOT have access to file editing tools.',
  },
  enterPlan: {
    tail: '- Users appreciate being consulted before significant changes are made to their codebase',
  },
  skill: {
    tail: 'tag in the current conversation turn, the skill has ALREADY been loaded - follow the instructions directly instead of calling this tool again',
  },
  conversationSummary: {
    tail: 'When you are using compact - please focus on test output and code changes. Include file reads verbatim.',
  },
  webfetchSummary: {
    tail: '- Never produce or reproduce exact song lyrics.',
  },
};

export interface ApplyPromptsResult {
  js: string;
  replacedTargets: OverlayKey[];
  missing: OverlayKey[];
}

/**
 * Detect the string delimiter that wraps the prompt at `index`. Walk backwards
 * a few KB looking for the most recent `\``, `"`, or `'`. Bun-compiled
 * Claude Code uses template literals for prompts that interpolate identifiers,
 * but a fallback to plain quotes keeps us compatible if upstream simplifies
 * a prompt later.
 */
const detectDelimiter = (js: string, index: number): '`' | '"' | "'" => {
  const start = Math.max(0, index - 8192);
  for (let i = index - 1; i >= start; i -= 1) {
    const c = js[i];
    if (c === '`' || c === '"' || c === "'") return c;
  }
  return '`';
};

const escapeForDelimiter = (text: string, delim: '`' | '"' | "'"): string => {
  if (delim === '`') {
    // Template literal: escape backticks and ${ interpolations.
    return text.replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
  }
  // Single/double quote: escape the delimiter and turn newlines into \n escapes.
  const escaped = text.replace(new RegExp(`(?<!\\\\)\\${delim}`, 'g'), `\\${delim}`);
  return escaped.replace(/\n/g, '\\n');
};

const buildOverlayBlock = (overlay: string, delim: '`' | '"' | "'"): string => {
  const trimmed = overlay.trim();
  if (!trimmed) return '';
  const block = `\n\n${OVERLAY_MARKERS.start}\n${trimmed}\n${OVERLAY_MARKERS.end}\n`;
  return escapeForDelimiter(block, delim);
};

/**
 * Locate (and remove) any existing overlay block right after `tailEnd`. Returns
 * the offset where the next byte of original prompt content resumes. Same idea
 * as the existing prompt-pack.ts upsert: replace, don't duplicate.
 */
const stripExistingBlock = (js: string, tailEnd: number, delim: '`' | '"' | "'"): { js: string; tailEnd: number } => {
  const escapedStart = escapeForDelimiter(`\n\n${OVERLAY_MARKERS.start}`, delim);
  const escapedEnd = escapeForDelimiter(`${OVERLAY_MARKERS.end}\n`, delim);
  if (js.slice(tailEnd, tailEnd + escapedStart.length) !== escapedStart) return { js, tailEnd };
  const endIdx = js.indexOf(escapedEnd, tailEnd + escapedStart.length);
  if (endIdx === -1) return { js, tailEnd };
  const stripUntil = endIdx + escapedEnd.length;
  return { js: js.slice(0, tailEnd) + js.slice(stripUntil), tailEnd };
};

export const applyPrompts = (oldFile: string, overlays: OverlayMap): ApplyPromptsResult => {
  const replacedTargets: OverlayKey[] = [];
  const missing: OverlayKey[] = [];
  let js = oldFile;

  for (const [keyRaw, overlayText] of Object.entries(overlays)) {
    const key = keyRaw as OverlayKey;
    if (!overlayText || !overlayText.trim()) continue;

    const spec = ANCHORS[key];
    if (!spec) {
      missing.push(key);
      continue;
    }

    const tailIdx = js.indexOf(spec.tail);
    if (tailIdx === -1) {
      missing.push(key);
      continue;
    }
    const tailEnd = tailIdx + spec.tail.length;
    const delim = detectDelimiter(js, tailIdx);

    const stripped = stripExistingBlock(js, tailEnd, delim);
    js = stripped.js;
    const block = buildOverlayBlock(overlayText, delim);
    if (!block) continue;

    js = js.slice(0, stripped.tailEnd) + block + js.slice(stripped.tailEnd);
    replacedTargets.push(key);
  }

  return { js, replacedTargets, missing };
};
