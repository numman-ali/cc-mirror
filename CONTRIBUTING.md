# Contributing to claude-sneakpeek

Thanks for your interest in contributing!

## Development Setup

```bash
# Clone the repo
git clone https://github.com/numman-ali/claude-sneakpeek.git
cd claude-sneakpeek

# Install dependencies
npm install

# Run in development mode
npm run dev -- --help
npm run tui

# Run tests
npm test

# Type check
npm run typecheck

# Bundle for distribution
npm run bundle
```

## Project Structure

```
src/
├── cli/           # CLI entry point and argument parsing
├── core/          # Core logic (create, update, remove variants)
├── tui/           # Interactive TUI (ink/React)
│   ├── screens/   # Screen components
│   └── components/# Reusable UI components
├── brands/        # Provider theme presets
└── providers/     # Provider templates (zai, minimax, etc.)

test/              # Tests (node:test)
scripts/           # Build scripts
```

## Adding a New Provider

1. Add the provider template in `src/providers/index.ts`
2. Add a brand preset in `src/brands/` (optional)
3. Update help text in `src/cli/help.ts`
4. Add tests in `test/`

## Code Style

- TypeScript with strict mode
- ESM modules
- Functional style preferred
- No emojis in code/output unless user requests

## Testing

```bash
# Run all tests
npm test

# Run specific test file
npm test -- test/core.test.ts
```

## Commits

Use conventional commits:

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `refactor:` Code refactoring
- `test:` Tests
- `chore:` Maintenance

## Pull Requests

1. Fork and create a branch
2. Make your changes
3. Run tests and type check
4. Submit PR with clear description

## Questions?

Open an issue or reach out on Twitter [@nummanali](https://twitter.com/nummanali).
