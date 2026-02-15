import { getRandomHaiku } from '../tui/content/haikus.js';
import { DEFAULT_BIN_DIR, DEFAULT_ROOT } from '../core/constants.js';

export const printHelp = () => {
  console.log(`
╔══════════════════════════════════════════════════════════════════════════╗
║                           CC-MIRROR                                      ║
║                     Claude Code, Unshackled                              ║
╚══════════════════════════════════════════════════════════════════════════╝

  Pre-configured Claude Code variants with custom providers,
  prompt packs, and battle-tested enhancements.

  One command. Instant power-up.

FOCUS
  CC-MIRROR focuses on provider enablement and maintainable workflows.

QUICK START
  npx cc-mirror quick --provider mirror    # Fastest path to Claude
  npx cc-mirror quick --provider zai       # Z.ai with GLM models
  npx cc-mirror quick --provider ollama    # Ollama local + cloud models
  npx cc-mirror                            # Interactive TUI

COMMANDS
  quick [options]              Fast setup: provider → ready in 30s
  create [options]             Full configuration wizard
  list                         List all variants
  update [name]                Update Claude Code (default: latest)
  apply <name>                 Re-apply tweakcc patches (no reinstall)
  remove <name>                Remove a variant
  doctor                       Health check all variants
  tweak <name>                 Launch tweakcc customization

OPTIONS (create/quick)
  --name <name>                Variant name (becomes CLI command)
  --prefix <value>             Prefix default variant name when --name is omitted
  --provider <name>            Provider: kimi | minimax | zai | openrouter | vercel | ollama | nanogpt | ccrouter | mirror | gatewayz
  --api-key <key>              Provider API key
  --auth-token <token>         Alias for --api-key (auth-token providers)
  --brand <preset>             Theme: auto | none | kimi | minimax | zai | openrouter | vercel | ollama | nanogpt | ccrouter | mirror | gatewayz
  --tui / --no-tui             Force TUI on/off

OPTIONS (advanced)
  --base-url <url>             ANTHROPIC_BASE_URL override
  --claude-version <spec>      Claude Code: stable | latest | x.y.z
  --settings-only              Skip Claude reinstall (update settings/theme only)
  --model <name>               Set Sonnet/Opus/Haiku all at once
  --model-sonnet <name>        Default Sonnet model
  --model-opus <name>          Default Opus model
  --model-haiku <name>         Default Haiku model
  --root <path>                Variants root (default: ${DEFAULT_ROOT})
  --bin-dir <path>             Wrapper install dir (default: ${DEFAULT_BIN_DIR})
  --no-tweak                   Skip tweakcc theming
  --no-prompt-pack             Skip provider prompt pack
  --allow-collision            Allow wrapper command name collisions (unsafe)
  --shell-env                  Write env vars to shell profile
  --verbose                    Show full tweakcc output during update
  --json                       Machine-readable output (list/doctor)
  --full                       Verbose output (list)
  --live                       Live provider probe (doctor)

PROVIDERS
  kimi          kimi-for-coding via Kimi Code
  minimax       MiniMax via MiniMax Cloud
  zai           GLM-5/4.7/4.5-Air via Z.ai Coding Plan
  openrouter    100+ models via OpenRouter
  vercel        Vercel AI Gateway
  ollama        Local + cloud models via Ollama
  nanogpt       NanoGPT
  ccrouter      Local LLMs via CC Router
  gatewayz      GatewayZ AI Gateway

EXAMPLES
  npx cc-mirror quick --provider mirror --name mclaude
  npx cc-mirror quick --provider zai --api-key "$Z_AI_API_KEY"
  npx cc-mirror apply mclaude
  npx cc-mirror update mclaude --claude-version latest
  npx cc-mirror doctor

LEARN MORE
  https://github.com/numman-ali/cc-mirror

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
