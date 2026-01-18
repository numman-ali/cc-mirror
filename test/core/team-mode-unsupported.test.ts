import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { TeamModeUpdateStep } from '../../src/core/variant-builder/update-steps/TeamModeUpdateStep.js';
import { TEAM_PACK_FILES } from '../../src/team-pack/index.js';
import type { UpdateContext } from '../../src/core/variant-builder/types.js';
import { makeTempDir, cleanup } from '../helpers/index.js';

const writeJson = (targetPath: string, data: unknown) => {
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.writeFileSync(targetPath, JSON.stringify(data, null, 2));
};

test('TeamModeUpdateStep cleans legacy team assets when unsupported', () => {
  const rootDir = makeTempDir('team-mode-unsupported-');
  const binDir = makeTempDir('team-mode-unsupported-bin-');

  try {
    const name = 'alpha';
    const variantDir = path.join(rootDir, name);
    const configDir = path.join(variantDir, 'config');
    const tweakDir = path.join(variantDir, 'tweakcc');
    const npmDir = path.join(variantDir, 'npm');

    const settingsPath = path.join(configDir, 'settings.json');
    writeJson(settingsPath, {
      env: {
        CLAUDE_CODE_TEAM_MODE: '1',
        CLAUDE_CODE_AGENT_TYPE: 'team-lead',
      },
      permissions: {
        allow: ['Skill(orchestration)', 'Skill(task-manager)'],
      },
    });

    const systemPromptsDir = path.join(tweakDir, 'system-prompts');
    fs.mkdirSync(systemPromptsDir, { recursive: true });
    for (const file of TEAM_PACK_FILES) {
      fs.writeFileSync(path.join(systemPromptsDir, file.target), 'legacy');
    }

    const tweakccConfigPath = path.join(tweakDir, 'config.json');
    writeJson(tweakccConfigPath, {
      settings: {
        toolsets: [
          { name: 'team', allowedTools: '*', blockedTools: ['TodoWrite'] },
          { name: 'zai', allowedTools: '*', blockedTools: [] },
        ],
        defaultToolset: 'team',
        planModeToolset: 'team',
      },
    });

    const ctx: UpdateContext = {
      name,
      opts: { enableTeamMode: true },
      meta: {
        name,
        provider: 'zai',
        createdAt: new Date().toISOString(),
        claudeOrig: '',
        binaryPath: '',
        configDir,
        tweakDir,
        binDir,
        npmDir,
        teamModeEnabled: true,
      },
      paths: {
        resolvedRoot: rootDir,
        resolvedBin: binDir,
        variantDir,
        npmDir,
      },
      prefs: {
        resolvedNpmPackage: '@anthropic-ai/claude-code',
        resolvedNpmVersion: '2.1.12',
        promptPackPreference: false,
        promptPackEnabled: false,
        skillInstallEnabled: false,
        shellEnvEnabled: false,
        skillUpdateEnabled: false,
        commandStdio: 'pipe',
      },
      state: {
        notes: [],
        tweakResult: null,
        brandKey: null,
      },
      report: () => {},
      isAsync: false,
    };

    new TeamModeUpdateStep().execute(ctx);

    const updatedSettings = JSON.parse(fs.readFileSync(settingsPath, 'utf8')) as {
      env?: Record<string, string>;
      permissions?: { allow?: string[] };
    };
    assert.ok(!updatedSettings.env?.CLAUDE_CODE_TEAM_MODE);
    assert.ok(!updatedSettings.env?.CLAUDE_CODE_AGENT_TYPE);
    assert.ok(!updatedSettings.permissions?.allow?.includes('Skill(orchestration)'));
    assert.ok(!updatedSettings.permissions?.allow?.includes('Skill(task-manager)'));

    for (const file of TEAM_PACK_FILES) {
      const targetPath = path.join(systemPromptsDir, file.target);
      assert.ok(!fs.existsSync(targetPath), `expected ${file.target} to be removed`);
    }

    const updatedConfig = JSON.parse(fs.readFileSync(tweakccConfigPath, 'utf8')) as {
      settings?: { toolsets?: Array<{ name: string }>; defaultToolset?: string; planModeToolset?: string };
    };
    assert.ok(!updatedConfig.settings?.toolsets?.some((t) => t.name === 'team'));
    assert.ok(updatedConfig.settings?.defaultToolset !== 'team');
    assert.ok(updatedConfig.settings?.planModeToolset !== 'team');
    assert.equal(ctx.meta.teamModeEnabled, false);
  } finally {
    cleanup(rootDir);
    cleanup(binDir);
  }
});
