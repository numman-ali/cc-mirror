---
name: task-manager
description: CLI tool for managing team tasks outside of Claude Code's built-in tools. Use this skill when tasks need to be archived, bulk cleaned up, or when you need a high-level view of task dependencies. Triggers: (1) User asks to clean up or archive completed tasks, (2) Too many resolved tasks cluttering the list, (3) Need to visualize task dependencies, (4) Want to manage tasks via command line.
---

# Task Manager CLI

You have access to `npx cc-mirror tasks` - a CLI for managing team tasks.

## Auto-Detection

The CLI auto-detects your context:

- **Variant**: From `CLAUDE_CONFIG_DIR` environment variable
- **Team**: From current working directory (git root folder name)

No need to specify `--variant` or `--team` in most cases.

## Commands

```bash
# List tasks
npx cc-mirror tasks                    # Open tasks (default)
npx cc-mirror tasks --status all       # All tasks

# View dependencies
npx cc-mirror tasks graph              # Visual dependency tree

# Archive resolved tasks (preserves history)
npx cc-mirror tasks archive --resolved --dry-run   # Preview
npx cc-mirror tasks archive --resolved             # Execute

# Delete permanently (no history)
npx cc-mirror tasks clean --resolved --dry-run     # Preview
npx cc-mirror tasks clean --resolved               # Execute

# Single task operations
npx cc-mirror tasks show <id>          # View details
npx cc-mirror tasks archive <id>       # Archive one task
npx cc-mirror tasks delete <id>        # Delete one task
```

## When to Use

Use `AskUserQuestion` to confirm with the user:

```
When tasks are cluttering:
  → "Archive resolved tasks?" (preserves in archive folder)
  → "Delete resolved tasks?" (permanent removal)
  → "Show task graph first?" (see dependencies)

When user wants to see other projects/teams:
  → "Which team?" (then use --team flag)
  → "Which variant?" (then use --variant flag)
  → "All teams?" (then use --all flag)
```

## Viewing Other Teams/Variants

By default, commands target your current team. To view others:

```bash
# Different team in same variant
npx cc-mirror tasks --team other-project

# Different variant
npx cc-mirror tasks --variant zai --team my-project

# All teams in current variant
npx cc-mirror tasks --all

# All variants, all teams
npx cc-mirror tasks --all-variants --all
```

Ask the user which team/variant they want to view using `AskUserQuestion`.

## Archive vs Delete

| Action  | Command              | Effect                                    |
| ------- | -------------------- | ----------------------------------------- |
| Archive | `archive --resolved` | Moves to `archive/` folder with timestamp |
| Delete  | `clean --resolved`   | Permanently removes files                 |

**Prefer archive** - it preserves task history for future reference.
