/**
 * Mock Core Module
 *
 * Factory for creating mock core module for TUI testing.
 */

export interface MockCoreCalls {
  create: Array<{ name: string; providerKey: string; noTweak?: boolean }>;
  update: Array<{ root: string; name: string }>;
  tweak: Array<{ root: string; name: string }>;
  remove: Array<{ root: string; name: string }>;
  doctor: Array<{ root: string; bin: string }>;
}

export const makeCore = () => {
  const calls: MockCoreCalls = {
    create: [],
    update: [],
    tweak: [],
    remove: [],
    doctor: [],
  };

  const core = {
    DEFAULT_ROOT: '/tmp/claude-sneakpeek-test',
    DEFAULT_BIN_DIR: '/tmp/claude-sneakpeek-bin',
    DEFAULT_NPM_PACKAGE: '@anthropic-ai/claude-code',
    DEFAULT_NPM_VERSION: '2.1.12',
    TEAM_MODE_SUPPORTED: false,
    listVariants: () => [
      {
        name: 'alpha',
        meta: {
          name: 'alpha',
          provider: 'zai',
          createdAt: '2025-12-31T00:00:00.000Z',
          claudeOrig: '/tmp/claude',
          binaryPath: '/tmp/alpha',
          configDir: '/tmp/alpha/config',
          tweakDir: '/tmp/alpha/tweakcc',
          wrapperPath: '/tmp/bin/alpha',
        },
      },
      {
        name: 'beta',
        meta: {
          name: 'beta',
          provider: 'minimax',
          createdAt: '2025-12-31T00:00:00.000Z',
          claudeOrig: '/tmp/claude',
          binaryPath: '/tmp/beta',
          configDir: '/tmp/beta/config',
          tweakDir: '/tmp/beta/tweakcc',
          wrapperPath: '/tmp/bin/beta',
        },
      },
    ],
    createVariant: (params: {
      name: string;
      providerKey: string;
      noTweak?: boolean;
      promptPack?: boolean;
      promptPackMode?: 'minimal' | 'maximal';
      skillInstall?: boolean;
      shellEnv?: boolean;
      modelOverrides?: {
        sonnet?: string;
        opus?: string;
        haiku?: string;
        smallFast?: string;
        defaultModel?: string;
        subagentModel?: string;
      };
    }) => {
      calls.create.push(params);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return { wrapperPath: `/tmp/bin/${params.name}`, meta: { name: params.name } as any, tweakResult: null };
    },
    updateVariant: (root: string, name: string, _opts?: { tweakccStdio?: 'pipe' | 'inherit'; binDir?: string }) => {
      calls.update.push({ root, name });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return { meta: { name } as any, tweakResult: null };
    },
    tweakVariant: (root: string, name: string) => {
      calls.tweak.push({ root, name });
    },
    removeVariant: (root: string, name: string) => {
      calls.remove.push({ root, name });
    },
    doctor: (root: string, bin: string) => {
      calls.doctor.push({ root, bin });
      return [
        { name: 'alpha', ok: true, binaryPath: '/tmp/alpha', wrapperPath: '/tmp/bin/alpha' },
        { name: 'beta', ok: false, binaryPath: '/tmp/beta', wrapperPath: '/tmp/bin/beta' },
      ];
    },
  };

  return { core, calls };
};
