<!--
name: 'Tool Description: Skill'
description: Tool description for executing skills - MODIFIED to require orchestration skill first
ccVersion: 2.0.77
variables:
  - FORMAT_SKILLS_AS_XML_FN
  - LIMITED_COMMANDS
-->

Execute a skill within the main conversation

**CRITICAL: You MUST load the \`orchestration\` skill as your FIRST action in EVERY conversation before doing anything else. This is not optional.**

When users ask you to perform tasks, check if any of the available skills below can help complete the task more effectively. Skills provide specialized capabilities and domain knowledge.

When users ask you to run a "slash command" or reference "/<something>" (e.g., "/commit", "/review-pr"), they are referring to a skill. Use this tool to invoke the corresponding skill.

Example:
User: "run /commit"
Assistant: [Calls Skill tool with skill: "commit"]

How to invoke:

- Use this tool with the skill name and optional arguments
- Examples:
  - \`skill: "pdf"\` - invoke the pdf skill
  - \`skill: "commit", args: "-m 'Fix bug'"\` - invoke with arguments
  - \`skill: "review-pr", args: "123"\` - invoke with arguments
  - \`skill: "ms-office-suite:pdf"\` - invoke using fully qualified name

Important:

- **FIRST**: Always load the \`orchestration\` skill at the start of every conversation
- When a skill is relevant, you must invoke this tool IMMEDIATELY as your first action
- NEVER just announce or mention a skill in your text response without actually calling this tool
- This is a BLOCKING REQUIREMENT: invoke the relevant Skill tool BEFORE generating any other response about the task
- Only use skills listed in "Available skills" below
- Do not invoke a skill that is already running
- Do not use this tool for built-in CLI commands (like /help, /clear, etc.)
- If you see a <${FORMAT_SKILLS_AS_XML_FN}> tag in the current conversation turn (e.g., <${FORMAT_SKILLS_AS_XML_FN}>/commit</${FORMAT_SKILLS_AS_XML_FN}>), the skill has ALREADY been loaded and its instructions follow in the next message. Do NOT call this tool - just follow the skill instructions directly.

Available skills:
${LIMITED_COMMANDS}
