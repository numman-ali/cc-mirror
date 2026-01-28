import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { applyPromptPack } from '../src/core/prompt-pack.js';
import { resolveOverlays } from '../src/core/prompt-pack/overlays.js';
import { sanitizeOverlayMap, sanitizeOverlayText } from '../src/core/prompt-pack/sanitize.js';
import { OVERLAY_MARKERS, PROMPT_PACK_TARGETS } from '../src/core/prompt-pack/targets.js';

const makeTempDir = () => fs.mkdtempSync(path.join(os.tmpdir(), 'claude-sneakpeek-prompt-pack-'));

const cleanup = (dir: string) => {
  fs.rmSync(dir, { recursive: true, force: true });
};

const writePromptFiles = (tweakDir: string) => {
  const systemPromptsDir = path.join(tweakDir, 'system-prompts');
  fs.mkdirSync(systemPromptsDir, { recursive: true });
  for (const target of PROMPT_PACK_TARGETS) {
    fs.writeFileSync(path.join(systemPromptsDir, target.filename), `# ${target.filename}\n`);
  }
  return systemPromptsDir;
};

test('sanitizeOverlayText removes backticks', () => {
  assert.equal(sanitizeOverlayText('Use `code` blocks.'), "Use 'code' blocks.");
  const sanitized = sanitizeOverlayMap({ main: 'Hello `world`', websearch: '   ' });
  assert.equal(sanitized.main, "Hello 'world'");
  assert.equal(Object.hasOwn(sanitized, 'websearch'), false);
});

test('resolveOverlays strips backticks for providers', () => {
  const providers = ['zai', 'minimax'] as const;
  for (const provider of providers) {
    const overlays = resolveOverlays(provider);
    for (const value of Object.values(overlays)) {
      if (!value) continue;
      assert.equal(value.includes('`'), false);
    }
  }
});

test('applyPromptPack writes overlays and is idempotent', () => {
  const tempDir = makeTempDir();
  const tweakDir = path.join(tempDir, 'tweakcc');
  const systemPromptsDir = writePromptFiles(tweakDir);

  const overlays = resolveOverlays('zai');
  const expectedUpdates = PROMPT_PACK_TARGETS.filter((target) => overlays[target.key]).length;

  const first = applyPromptPack(tweakDir, 'zai');
  assert.equal(first.changed, true);
  assert.equal(first.updated.length, expectedUpdates);

  const mainPath = path.join(systemPromptsDir, 'system-prompt-main-system-prompt.md');
  const content = fs.readFileSync(mainPath, 'utf8');
  assert.ok(content.includes(OVERLAY_MARKERS.start));
  assert.ok(content.includes(OVERLAY_MARKERS.end));
  assert.ok(content.includes('Provider: z.ai (GLM)'));
  const start = content.indexOf(OVERLAY_MARKERS.start);
  const end = content.indexOf(OVERLAY_MARKERS.end);
  assert.ok(start !== -1 && end !== -1);
  const overlayText = content.slice(start + OVERLAY_MARKERS.start.length, end);
  assert.equal(overlayText.includes('`'), false);

  const second = applyPromptPack(tweakDir, 'zai');
  assert.equal(second.changed, false);
  assert.equal(second.updated.length, 0);

  cleanup(tempDir);
});
