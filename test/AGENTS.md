# Test Suite

Node.js built-in test runner with `tsx` for TypeScript.

## Commands

```bash
npm test                              # All tests
npm test -- --test-name-pattern="E2E" # E2E only
npm test -- --test-name-pattern="TUI" # TUI only
npm run test:coverage                 # With c8 coverage
```

## Structure

| Directory  | Tests                                              |
| ---------- | -------------------------------------------------- |
| `e2e/`     | Variant creation, team mode, blocked tools, doctor |
| `tui/`     | Screen components, navigation, hooks               |
| `cli/`     | Argument parsing, doctor output                    |
| `core/`    | Wrapper generation, tweakcc                        |
| `helpers/` | Test utilities (see below)                         |

## Test Helpers

Import from `test/helpers/index.js`:

| Helper                           | Purpose                             |
| -------------------------------- | ----------------------------------- |
| `makeTempDir(prefix?)`           | Create temp directory               |
| `cleanup(dir)`                   | Recursive delete                    |
| `writeExecutable(path, content)` | Write with 0o755                    |
| `makeCore()`                     | Mock core module with call tracking |
| `tick()`                         | Wait 30ms for Ink updates           |
| `send(stdin, input)`             | Send key input + tick               |
| `waitFor(predicate)`             | Poll until true (50 attempts)       |
| `KEYS`                           | `{ up, down, enter, escape, tab }`  |
| `withFakeNpm(fn)`                | Run with mock npm in PATH           |

## Patterns

### E2E Test with Cleanup

```typescript
test('E2E: Feature', async (t) => {
  const dirs: string[] = [];
  t.after(() => dirs.forEach(cleanup));

  await t.test('case', async () => {
    const dir = makeTempDir();
    dirs.push(dir);
    // test
  });
});
```

### TUI Component Test

```typescript
test('Screen', async () => {
  const app = render(React.createElement(Screen, { onSelect }));
  await send(app.stdin, KEYS.enter);
  assert.ok(app.lastFrame()?.includes('expected'));
  app.unmount();
});
```

### Simple Unit Test

```typescript
test('function', () => {
  const result = fn(input);
  assert.equal(result, expected);
});
```

## Conventions

- File naming: `*.test.ts` or `*.test.tsx`
- Always use strict assertions: `import assert from 'node:assert/strict'`
- Cleanup: `try/finally` for simple tests, `t.after()` for suites
- No real npm downloads in tests - use `withFakeNpm()`
