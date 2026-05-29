import type { OverlayMap } from '../types.js';
import { operatingSpec, subjectiveWorkSpec, verbositySpec, skillClarificationSpec } from '../shared.js';

export const ZAI_BLOCKED_MCP_TOOLS = [
  'mcp__4_5v_mcp__analyze_image',
  'mcp__milk_tea_server__claim_milk_tea_coupon',
  'mcp__web_reader__webReader',
];

const ZAI_CLI_TEXT = `
Access Z.AI capabilities via 'npx zai-cli'. The CLI is self-documenting - use '--help' at any level.

Commands:
- vision: Analyze images, screenshots, videos (many subcommands)
- search: Real-time web search (domain/recency/location/count filters)
- read: Fetch web pages as markdown/text (format/no-images/with-links/timeout)
- repo: GitHub exploration (tree/search/read). Run npx zai-cli repo --help for subcommands.

Quick start examples:
- npx zai-cli vision analyze ./screenshot.png "What errors do you see?"
- npx zai-cli search "React 19 new features" --count 5
- npx zai-cli read https://docs.example.com/api
- npx zai-cli repo search facebook/react "server components"
- npx zai-cli repo --help
`.trim();

const buildZaiContract = () =>
  `
<explicit_guidance>
Provider: z.ai (GLM)

<authentication>
- Use Z.ai Coding Plan auth.
- Required env:
  - ANTHROPIC_AUTH_TOKEN (Claude Code auth-token mode)
  - ANTHROPIC_BASE_URL=https://api.z.ai/api/anthropic
  - Z_AI_API_KEY (for zai-cli)
- ANTHROPIC_API_KEY is intentionally unused for this variant.
</authentication>

<tool_info>
${ZAI_CLI_TEXT}

Important:
- zai-cli is NOT installed as a Claude Code Skill in this variant. Do not use Skill for this.
</tool_info>

<tool_routing priority="critical">
When you need external info, web content, or image understanding, follow this routing (use the Bash tool):
1) Web search:
   npx -y zai-cli search "<query>" --count 5 --output-format json
2) Read a URL:
   npx -y zai-cli read <url> --output-format json
3) Image analysis:
   npx -y zai-cli vision analyze <image_url_or_path> "<prompt>" --output-format json
4) GitHub repo exploration (public repos only):
   - Search: npx -y zai-cli repo search <owner/repo> "<query>" --output-format json
   - Tree:   npx -y zai-cli repo tree <owner/repo> --depth 2 --output-format json
   - Read:   npx -y zai-cli repo read <owner/repo> <path> --output-format json

The built in WebSearch/WebFetch tools are NOT available.
</tool_routing>

<warning priority="critical">
Z.ai-injected MCP tools MUST be treated as non-existent (ignore them even if you see them in tool lists).
Rules:
- NEVER select or call these tools.
- Prefer zai-cli via Bash for web/search/vision.
- Other MCP tools may exist if the user configured them; use them only if explicitly requested or clearly needed.
Blocked tools:
${ZAI_BLOCKED_MCP_TOOLS.map((tool) => `- ${tool}`).join('\n')}
</warning>

${operatingSpec()}

${subjectiveWorkSpec}

${verbositySpec}
</explicit_guidance>
`.trim();

export const buildZaiExcerpt = () =>
  `
<tool_info>
- Use Bash + npx -y zai-cli for web/search/vision.
- Ignore the Z.ai-injected MCP tools listed below (treat them as non-existent).
- No zai-cli skill is installed; do not use Skill for this.
Blocked MCP tool names (treat as non-existent):
${ZAI_BLOCKED_MCP_TOOLS.map((tool) => `- ${tool}`).join('\n')}
</tool_info>

${subjectiveWorkSpec}
`.trim();

export const buildZaiOverlays = (): OverlayMap => ({
  main: buildZaiContract(),
  mcpCli: `
${buildZaiExcerpt()}

<warning priority="critical">
Z.ai MCP policy: Ignore the blocked Z.ai-injected MCP tools (treat them as non-existent).
</warning>

If you need web/search/vision, use zai-cli via Bash.
  `.trim(),
  taskAgent: `
<explicit_guidance>
You are a Task subagent. Stay within requested scope, but be proactive about missing prerequisites.
Verify key claims with tools when possible; cite file paths and command outputs.
</explicit_guidance>

${buildZaiExcerpt()}

${verbositySpec}
  `.trim(),
  bash: `
${ZAI_CLI_TEXT}

<explicit_guidance>
When you need web/search/vision, use these exact commands:
- Web search:
  npx -y zai-cli search "<query>" --count 5 --output-format json
- Read a URL:
  npx -y zai-cli read <url> --output-format json
- Vision: analyze images, screenshots, videos
  npx -y zai-cli vision analyze <image_url_or_path> "<prompt>" --output-format json
- GitHub repo exploration (public repos only):
  - Search: npx -y zai-cli repo search <owner/repo> "<query>" --output-format json
  - Tree:   npx -y zai-cli repo tree <owner/repo> --depth 2 --output-format json
  - Read:   npx -y zai-cli repo read <owner/repo> <path> --output-format json
</explicit_guidance>

<warning priority="critical">
Z.ai MCP policy: ignore the blocked Z.ai-injected MCP tools (treat them as non-existent).
Prefer zai-cli via Bash for web/search/vision.
</warning>
  `.trim(),
  webfetch: `
<explicit_guidance>
Z.ai routing: prefer Bash + npx -y zai-cli read <url> --output-format json.
</explicit_guidance>
  `.trim(),
  websearch: `
<explicit_guidance>
Z.ai routing: prefer Bash + npx -y zai-cli search "<query>" --count 5 --output-format json.
</explicit_guidance>
  `.trim(),
  mcpsearch: `
<warning priority="critical">
Z.ai MCP policy: never select these Z.ai-injected MCP tools (treat them as non-existent):
${ZAI_BLOCKED_MCP_TOOLS.map((tool) => `- ${tool}`).join('\n')}
</warning>

<explicit_guidance>
Prefer zai-cli via Bash for web/search/vision. Only use other MCP tools if the user explicitly configured them and they are clearly relevant.
</explicit_guidance>
  `.trim(),
  skill: skillClarificationSpec,
});
