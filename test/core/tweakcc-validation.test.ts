import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  getConfiguredTweakccSpec,
  runTweakcc,
  runTweakccAsync,
  validatePatchedClaude,
} from '../../src/core/tweakcc.js';
import { cleanup, makeTempDir, writeExecutable } from '../helpers/index.js';

const withEnv = <T>(key: string, value: string | undefined, fn: () => T): T => {
  const previous = process.env[key];
  try {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
    return fn();
  } finally {
    if (previous === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = previous;
    }
  }
};

const writeStubNpx = (dir: string, script: string) => {
  const stubNpx = path.join(dir, 'npx');
  writeExecutable(stubNpx, script);
  return stubNpx;
};

const writeVersionBinary = (filePath: string, version = '2.1.156 (Claude Code)') => {
  writeExecutable(filePath, `#!/usr/bin/env bash\necho '${version}'\n`);
};

test('getConfiguredTweakccSpec uses default and validates override', () => {
  withEnv('CC_MIRROR_TWEAKCC_VERSION', undefined, () => {
    assert.equal(getConfiguredTweakccSpec(), '4.0.13');
  });

  withEnv('CC_MIRROR_TWEAKCC_VERSION', 'latest', () => {
    assert.equal(getConfiguredTweakccSpec(), 'latest');
  });

  withEnv('CC_MIRROR_TWEAKCC_VERSION', '4.0.13', () => {
    assert.equal(getConfiguredTweakccSpec(), '4.0.13');
  });

  withEnv('CC_MIRROR_TWEAKCC_VERSION', 'bad spec', () => {
    assert.throws(() => getConfiguredTweakccSpec(), /Invalid CC_MIRROR_TWEAKCC_VERSION/);
  });
});

test('validatePatchedClaude fails invalid generated patched JS', () => {
  const tweakDir = makeTempDir('tweakcc-validation-');
  try {
    fs.writeFileSync(path.join(tweakDir, 'native-claudejs-patched.js'), 'const broken = ;\n');
    const result = validatePatchedClaude(tweakDir, process.execPath);
    assert.equal(result.ok, false);
    assert.match(result.message ?? '', /syntax check/i);
  } finally {
    cleanup(tweakDir);
  }
});

test(
  'validatePatchedClaude detects Bun CommonJS wrapper error even with exit zero',
  { skip: process.platform === 'win32' },
  () => {
    const tweakDir = makeTempDir('tweakcc-validation-');
    const binaryPath = path.join(tweakDir, 'claude');
    try {
      writeExecutable(
        binaryPath,
        '#!/usr/bin/env bash\necho "TypeError: Expected CommonJS module to have a function wrapper" >&2\n'
      );

      const result = validatePatchedClaude(tweakDir, binaryPath);
      assert.equal(result.ok, false);
      assert.match(result.message ?? '', /failed --version/i);
    } finally {
      cleanup(tweakDir);
    }
  }
);

test(
  'runTweakcc retries latest when pinned tweakcc exits zero but validation fails',
  {
    skip: process.platform === 'win32',
  },
  () => {
    const root = makeTempDir('tweakcc-retry-');
    const stubBin = path.join(root, 'bin');
    const tweakDir = path.join(root, 'tweakcc');
    const binaryPath = path.join(root, 'claude');
    const logPath = path.join(root, 'calls.log');
    const previousPath = process.env.PATH;

    try {
      fs.mkdirSync(stubBin, { recursive: true });
      fs.mkdirSync(tweakDir, { recursive: true });
      writeVersionBinary(binaryPath);
      writeStubNpx(
        stubBin,
        `#!/usr/bin/env bash
echo "$@" >> "${logPath}"
if [[ "$1" == "tweakcc@latest" ]]; then
  echo "const ok = 1;" > "$TWEAKCC_CONFIG_DIR/native-claudejs-patched.js"
  echo "fallback ok"
  exit 0
fi
echo "const broken = ;" > "$TWEAKCC_CONFIG_DIR/native-claudejs-patched.js"
echo "primary ok"
exit 0
`
      );

      process.env.PATH = `${stubBin}${path.delimiter}${previousPath || ''}`;

      const result = runTweakcc(tweakDir, binaryPath, 'pipe');
      assert.equal(result.status, 0);
      assert.equal(result.tweakccSpec, 'latest');
      assert.equal(result.fallbackFromTweakccSpec, '4.0.13');
      assert.match(fs.readFileSync(logPath, 'utf8'), /tweakcc@4\.0\.13 --apply[\s\S]*tweakcc@latest --apply/);
    } finally {
      process.env.PATH = previousPath;
      cleanup(root);
    }
  }
);

test(
  'runTweakcc passes explicit patch allowlist to tweakcc',
  {
    skip: process.platform === 'win32',
  },
  () => {
    const root = makeTempDir('tweakcc-patches-');
    const stubBin = path.join(root, 'bin');
    const tweakDir = path.join(root, 'tweakcc');
    const binaryPath = path.join(root, 'claude');
    const logPath = path.join(root, 'calls.log');
    const previousPath = process.env.PATH;

    try {
      fs.mkdirSync(stubBin, { recursive: true });
      fs.mkdirSync(tweakDir, { recursive: true });
      writeVersionBinary(binaryPath);
      writeStubNpx(
        stubBin,
        `#!/usr/bin/env bash
echo "$@" >> "${logPath}"
echo "const ok = 1;" > "$TWEAKCC_CONFIG_DIR/native-claudejs-patched.js"
exit 0
`
      );

      process.env.PATH = `${stubBin}${path.delimiter}${previousPath || ''}`;

      const result = runTweakcc(tweakDir, binaryPath, 'pipe', ['themes', 'agents-md']);
      assert.equal(result.status, 0);
      assert.match(fs.readFileSync(logPath, 'utf8'), /--apply --patches themes,agents-md/);
    } finally {
      process.env.PATH = previousPath;
      cleanup(root);
    }
  }
);

test(
  'runTweakccAsync validates and retries latest on patched JS failure',
  {
    skip: process.platform === 'win32',
  },
  async () => {
    const root = makeTempDir('tweakcc-async-retry-');
    const stubBin = path.join(root, 'bin');
    const tweakDir = path.join(root, 'tweakcc');
    const binaryPath = path.join(root, 'claude');
    const previousPath = process.env.PATH;

    try {
      fs.mkdirSync(stubBin, { recursive: true });
      fs.mkdirSync(tweakDir, { recursive: true });
      writeVersionBinary(binaryPath);
      writeStubNpx(
        stubBin,
        `#!/usr/bin/env bash
if [[ "$1" == "tweakcc@latest" ]]; then
  echo "const ok = 1;" > "$TWEAKCC_CONFIG_DIR/native-claudejs-patched.js"
  exit 0
fi
echo "const broken = ;" > "$TWEAKCC_CONFIG_DIR/native-claudejs-patched.js"
exit 0
`
      );

      process.env.PATH = `${stubBin}${path.delimiter}${previousPath || ''}`;

      const result = await runTweakccAsync(tweakDir, binaryPath, 'pipe');
      assert.equal(result.status, 0);
      assert.equal(result.tweakccSpec, 'latest');
      assert.equal(result.validationStatus, 'passed');
    } finally {
      process.env.PATH = previousPath;
      cleanup(root);
    }
  }
);

test(
  'runTweakcc restores the pristine binary when pinned and latest validation both fail',
  {
    skip: process.platform === 'win32',
  },
  () => {
    const root = makeTempDir('tweakcc-restore-');
    const stubBin = path.join(root, 'bin');
    const tweakDir = path.join(root, 'tweakcc');
    const binaryPath = path.join(root, 'claude');
    const originalBinary = "#!/usr/bin/env bash\necho '2.1.156 (Claude Code)'\n";
    const previousPath = process.env.PATH;

    try {
      fs.mkdirSync(stubBin, { recursive: true });
      fs.mkdirSync(tweakDir, { recursive: true });
      writeExecutable(binaryPath, originalBinary);
      writeStubNpx(
        stubBin,
        `#!/usr/bin/env bash
cat > "$TWEAKCC_CC_INSTALLATION_PATH" <<'BROKEN'
#!/usr/bin/env bash
echo broken >&2
exit 1
BROKEN
chmod +x "$TWEAKCC_CC_INSTALLATION_PATH"
echo "const broken = ;" > "$TWEAKCC_CONFIG_DIR/native-claudejs-patched.js"
exit 0
`
      );

      process.env.PATH = `${stubBin}${path.delimiter}${previousPath || ''}`;

      const result = runTweakcc(tweakDir, binaryPath, 'pipe');
      assert.notEqual(result.status, 0);
      assert.match(result.stderr ?? '', /cc-mirror validation failed/i);
      assert.equal(fs.readFileSync(binaryPath, 'utf8'), originalBinary);
    } finally {
      process.env.PATH = previousPath;
      cleanup(root);
    }
  }
);

test(
  'runTweakcc surfaces partial tweakcc failures as warnings when validation passes',
  {
    skip: process.platform === 'win32',
  },
  () => {
    const root = makeTempDir('tweakcc-warning-');
    const stubBin = path.join(root, 'bin');
    const tweakDir = path.join(root, 'tweakcc');
    const binaryPath = path.join(root, 'claude');
    const previousPath = process.env.PATH;

    try {
      fs.mkdirSync(stubBin, { recursive: true });
      fs.mkdirSync(tweakDir, { recursive: true });
      writeVersionBinary(binaryPath);
      writeStubNpx(
        stubBin,
        `#!/usr/bin/env bash
echo "const ok = 1;" > "$TWEAKCC_CONFIG_DIR/native-claudejs-patched.js"
echo "Customizations applied with some failures"
exit 0
`
      );

      process.env.PATH = `${stubBin}${path.delimiter}${previousPath || ''}`;

      const result = runTweakcc(tweakDir, binaryPath, 'pipe');
      assert.equal(result.status, 0);
      assert.ok(result.warnings?.some((warning) => warning.includes('partial patch failures')));
    } finally {
      process.env.PATH = previousPath;
      cleanup(root);
    }
  }
);
