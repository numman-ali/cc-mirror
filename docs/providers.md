# Alternative Providers

claude-sneakpeek supports multiple API providers inherited from cc-mirror.

## Mirror (default)

Uses the standard Anthropic API. Authenticate normally via OAuth or API key.

```bash
npx @realmikekelly/claude-sneakpeek quick --provider mirror --name claudesp
```

## Provider Options

| Provider       | Models                 | Auth       | Best For                        |
| -------------- | ---------------------- | ---------- | ------------------------------- |
| **mirror**     | Claude (Anthropic)     | OAuth/Key  | Standard Claude Code experience |
| **Z.ai**       | GLM-4.7, GLM-4.5-Air   | API Key    | Heavy coding with GLM reasoning |
| **MiniMax**    | MiniMax-M2.1           | API Key    | Unified model experience        |
| **OpenRouter** | 100+ models            | Auth Token | Model flexibility, pay-per-use  |
| **CCRouter**   | Ollama, DeepSeek, etc. | Optional   | Local-first development         |

## Examples

```bash
# Z.ai (GLM Coding Plan)
npx @realmikekelly/claude-sneakpeek quick --provider zai --api-key "$Z_AI_API_KEY"

# MiniMax (MiniMax-M2.1)
npx @realmikekelly/claude-sneakpeek quick --provider minimax --api-key "$MINIMAX_API_KEY"

# OpenRouter (100+ models)
npx @realmikekelly/claude-sneakpeek quick --provider openrouter --api-key "$OPENROUTER_API_KEY" \
  --model-sonnet "anthropic/claude-sonnet-4-20250514"

# Claude Code Router (local LLMs)
npx @realmikekelly/claude-sneakpeek quick --provider ccrouter
```

## CLI Options

```
--provider <name>        mirror | zai | minimax | openrouter | ccrouter | custom
--name <name>            Variant name (becomes the CLI command)
--api-key <key>          Provider API key
--base-url <url>         Custom API endpoint
--model-sonnet <name>    Map to sonnet model
--model-opus <name>      Map to opus model
--model-haiku <name>     Map to haiku model
--brand <preset>         Theme: auto | zai | minimax | openrouter | ccrouter | mirror
--no-tweak               Skip tweakcc theme
--no-prompt-pack         Skip provider prompt pack
```

## Brand Themes

Each provider includes a custom color theme via [tweakcc](https://github.com/Piebald-AI/tweakcc):

| Brand          | Style                            |
| -------------- | -------------------------------- |
| **mirror**     | Silver/chrome with electric blue |
| **zai**        | Dark carbon with gold accents    |
| **minimax**    | Coral/red/orange spectrum        |
| **openrouter** | Teal/cyan gradient               |
| **ccrouter**   | Sky blue accents                 |
