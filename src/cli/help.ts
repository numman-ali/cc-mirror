import { getRandomHaiku } from '../tui/content/haikus.js';
import { DEFAULT_BIN_DIR, DEFAULT_ROOT } from '../core/constants.js';

export const printHelp = () => {
  console.log(`
╔══════════════════════════════════════════════════════════════════════════╗
║                        CLAUDE-SNEAKPEEK                                  ║
║                     Claude Code, Unshackled                              ║
╚══════════════════════════════════════════════════════════════════════════╝

  Pre-configured Claude Code variants with custom providers,
  prompt packs, and battle-tested enhancements.

  One command. Instant power-up.

FOCUS
  CLAUDE-SNEAKPEEK focuses on provider enablement and stable workflows.
  Team mode is only supported in claude-sneakpeek 1.6.3 (published release).

QUICK START
  npx claude-sneakpeek quick --provider mirror    # Fastest path to multi-agent
  npx claude-sneakpeek quick --provider zai       # Z.ai with GLM models
  npx claude-sneakpeek                            # Interactive TUI

COMMANDS
  quick [options]              Fast setup: provider → ready in 30s
  create [options]             Full configuration wizard
  list                         List all variants
  update [name]                Update to latest Claude Code
  remove <name>                Remove a variant
  doctor                       Health check all variants
  tweak <name>                 Launch tweakcc customization
  tasks [operation]            Manage legacy team tasks (claude-sneakpeek 1.6.3 only)

OPTIONS (create/quick)
  --name <name>                Variant name (becomes CLI command)
  --provider <name>            Provider: mirror | zai | minimax | openrouter | ccrouter
  --api-key <key>              Provider API key
  --brand <preset>             Theme: auto | none | mirror | zai | minimax
  --tui / --no-tui             Force TUI on/off

OPTIONS (advanced)
  --base-url <url>             ANTHROPIC_BASE_URL override
  --model-sonnet <name>        Default Sonnet model
  --model-opus <name>          Default Opus model
  --model-haiku <name>         Default Haiku model
  --root <path>                Variants root (default: ${DEFAULT_ROOT})
  --bin-dir <path>             Wrapper install dir (default: ${DEFAULT_BIN_DIR})
  --no-tweak                   Skip tweakcc theming
  --no-prompt-pack             Skip provider prompt pack
  --shell-env                  Write env vars to shell profile
  --verbose                    Show full tweakcc output during update

PROVIDERS
  mirror        Pure Claude (recommended)
  zai           GLM-4.7 via Z.ai Coding Plan
  minimax       MiniMax-M2.1 via MiniMax Cloud
  openrouter    100+ models via OpenRouter
  ccrouter      Local LLMs via Claude Code Router

EXAMPLES
  npx claude-sneakpeek quick --provider mirror --name mclaude
  npx claude-sneakpeek quick --provider zai --api-key "$Z_AI_API_KEY"
  npx claude-sneakpeek tasks graph
  npx claude-sneakpeek doctor

LEARN MORE
  https://github.com/mikekelly/claude-sneakpeek

────────────────────────────────────────────────────────────────────────────
Created by Numman Ali • https://x.com/nummanali
`);
};

/**
 * Print a random haiku (easter egg: --haiku flag)
 */
export const printHaiku = () => {
  const haiku = getRandomHaiku();
  console.log(`
    ─────────────────────────────
    ${haiku[0]}
    ${haiku[1]}
    ${haiku[2]}
    ─────────────────────────────
`);
};
