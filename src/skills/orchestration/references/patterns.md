# Orchestration Patterns Reference

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   Patterns are your playbook.                               │
│   Master them, and you'll instinctively know how to         │
│   decompose any task into elegant parallel execution.       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Core Principles

**All patterns build on Task Graph.** Every non-trivial task starts with `TaskCreate` to decompose work, then uses agents to execute. The patterns below describe how agents are orchestrated within that structure.

**All agents run in background.** Always use `run_in_background=True`. This enables true async orchestration with automatic notifications when agents complete.

```
┌────────────────────────────────────────────┐
│  Remember:                                 │
│  • Users never see pattern names           │
│  • Agents ALWAYS run in background         │
│  • Notifications arrive when complete      │
└────────────────────────────────────────────┘
```

## Table of Contents

1. [Task Graph Pattern (Default)](#task-graph-pattern)
2. [Fan-Out Pattern](#fan-out-pattern)
3. [Pipeline Pattern](#pipeline-pattern)
4. [Map-Reduce Pattern](#map-reduce-pattern)
5. [Speculative Pattern](#speculative-pattern)
6. [Background Pattern](#background-pattern)
7. [Parallelization Rules](#parallelization-rules)
8. [Pattern Combinations](#pattern-combinations)
9. [Error Recovery](#error-recovery)
10. [Result Synthesis](#result-synthesis)

---

## Task Graph Pattern

**The foundation for all orchestration.** Complex dependencies managed through TaskCreate/TaskUpdate.

```
Task A ──► Task B ──► Task D
              │          │
              └──► Task C ┘
```

**When to use:** Always. Every multi-step task should be decomposed into TaskCreate.

**Implementation:**

```python
# 1. Create all tasks
TaskCreate(subject="Setup database schema", description="...")
TaskCreate(subject="Implement user model", description="...")
TaskCreate(subject="Build API endpoints", description="...")

# 2. Set dependencies
TaskUpdate(taskId="2", addBlockedBy=["1"])
TaskUpdate(taskId="3", addBlockedBy=["2"])

# 3. Find unblocked tasks and spawn agents
TaskList()  # Find tasks with empty blockedBy
Task(subagent_type="general-purpose", prompt="TaskId 1: Setup database...", model="sonnet", run_in_background=True)

# 4. Agents mark complete, repeat
TaskUpdate(taskId="1", status="resolved")
TaskList()  # Task 2 now unblocked
```

---

## Fan-Out Pattern

Launch multiple independent agents in parallel. Use when subtasks have no dependencies.

```
Orchestrator
    ├──► Agent A (subtask 1)
    ├──► Agent B (subtask 2)  ← All launch simultaneously
    └──► Agent C (subtask 3)
```

**When to use:** Independent file analysis, parallel searches, multi-component implementation

**Implementation:**

```python
# Single message with multiple background agents (haiku for fast exploration)
Task(subagent_type="Explore", prompt="Analyze auth module...", model="haiku", run_in_background=True)
Task(subagent_type="Explore", prompt="Analyze database layer...", model="haiku", run_in_background=True)
Task(subagent_type="Explore", prompt="Analyze API routes...", model="haiku", run_in_background=True)
```

**Critical:** All Task calls MUST be in ONE message AND use `run_in_background=True`.

---

## Pipeline Pattern

Sequential agents where each output feeds the next. Use when steps have data dependencies.

```
Agent A → output → Agent B → output → Agent C → final result
```

**When to use:** Research→Plan→Implement, Analyze→Design→Build, Parse→Transform→Validate

**Implementation:**

```python
# Step 1: Research (haiku - fast exploration)
Task(subagent_type="Explore", prompt="Find all API endpoints...", model="haiku", run_in_background=True)
# → Notification arrives with result1

# Step 2: Plan (opus - needs critical thinking for design)
Task(subagent_type="Plan", prompt=f"Given endpoints: {result1}, design...", model="opus", run_in_background=True)
# → Notification arrives with result2

# Step 3: Implement (sonnet - well-structured from plan)
Task(subagent_type="general-purpose", prompt=f"Implement this plan: {result2}", model="sonnet", run_in_background=True)
```

---

## Map-Reduce Pattern

Distribute work across agents, aggregate results. Use when processing collections.

```
         ┌──► Agent A ──┐
Input ──►├──► Agent B ──┼──► Aggregator → Final Result
         └──► Agent C ──┘
```

**When to use:** Analyzing multiple files, reviewing multiple PRs, processing data batches

**Implementation:**

```python
# MAP: Launch parallel agents (opus for security - needs critical thinking)
Task(subagent_type="general-purpose", prompt="Analyze file1.ts for security issues", model="opus", run_in_background=True)
Task(subagent_type="general-purpose", prompt="Analyze file2.ts for security issues", model="opus", run_in_background=True)
Task(subagent_type="general-purpose", prompt="Analyze file3.ts for security issues", model="opus", run_in_background=True)

# REDUCE: Collect and synthesize
results = [TaskOutput(task_id=id) for id in task_ids]
# Synthesize findings into unified report
```

---

## Speculative Pattern

Try multiple approaches simultaneously, use best result. Use when optimal approach is unclear.

```
         ┌──► Approach A ──┐
Problem ─├──► Approach B ──┼──► Evaluate → Best Solution
         └──► Approach C ──┘
```

**When to use:** Uncertain algorithms, multiple valid architectures, performance optimization

**Implementation:**

```python
# Launch competing approaches (sonnet for implementation)
Task(subagent_type="general-purpose", prompt="Implement using recursive approach...", model="sonnet", run_in_background=True)
Task(subagent_type="general-purpose", prompt="Implement using iterative approach...", model="sonnet", run_in_background=True)
Task(subagent_type="general-purpose", prompt="Implement using memoization...", model="sonnet", run_in_background=True)

# Notifications arrive → Evaluate and select best
```

---

## Background Pattern

Long-running agents while continuing foreground work.

**When to use:** Test suites, builds, large analysis, external API calls

**Implementation:**

```python
# Launch background work (sonnet for test execution)
Task(subagent_type="general-purpose", prompt="Run full test suite...", model="sonnet", run_in_background=True)

# Continue foreground work
# ... do other tasks ...

# Check later
TaskOutput(task_id="...", block=False)  # Non-blocking check
TaskOutput(task_id="...", block=True)   # Block until complete
```

---

## Parallelization Rules

### MUST Parallelize

- Independent file reads
- Independent searches (Glob, Grep)
- Independent agent tasks
- Independent API calls

### MUST NOT Parallelize

- Tasks with data dependencies
- Sequential workflow steps
- Operations on same resource

### Syntax

```python
# CORRECT: Single message, multiple tool calls
<message>
  Task(...task1...)
  Task(...task2...)
  Task(...task3...)
</message>

# WRONG: Separate messages (sequential execution)
<message>Task(...task1...)</message>
<message>Task(...task2...)</message>
```

---

## Pattern Combinations

Complex tasks often combine multiple patterns:

### Pipeline + Fan-Out

```
Phase 1: PIPELINE (Research → Plan)
├─ Explore agent: Find existing patterns
└─ Plan agent: Design architecture

Phase 2: FAN-OUT (Parallel Implementation)
├─ Agent A: Implement component 1
├─ Agent B: Implement component 2
└─ Agent C: Implement component 3

Phase 3: PIPELINE (Integration)
└─ General-purpose agent: Wire components, test
```

### Map-Reduce + Background

```
# Launch map phase in background
Task(...file1..., run_in_background=True)
Task(...file2..., run_in_background=True)

# Do other work while waiting

# Collect and reduce
results = [TaskOutput(id) for id in task_ids]
# Synthesize
```

### Speculative + Pipeline

```python
# Try multiple approaches (sonnet for implementation)
Task(subagent_type="general-purpose", prompt="Approach A...", model="sonnet", run_in_background=True)
Task(subagent_type="general-purpose", prompt="Approach B...", model="sonnet", run_in_background=True)

# Notifications arrive → Evaluate and continue with winner
winner = evaluate(approach_a, approach_b)
Task(subagent_type="general-purpose", prompt=f"Refine and complete: {winner}", model="sonnet", run_in_background=True)
```

---

## Error Recovery

### Failure Types

| Failure        | Cause                             | Recovery                                     |
| -------------- | --------------------------------- | -------------------------------------------- |
| Timeout        | Agent took too long               | Retry with smaller scope or simpler model    |
| Incomplete     | Agent returned partial work       | Create follow-up task for remainder          |
| Wrong approach | Agent misunderstood               | Retry with clearer prompt                    |
| Blocked        | Missing dependency                | Check if blocker task failed                 |
| Conflict       | Multiple agents touched same file | Resolve manually or re-run with coordination |

### Retry Strategy

```python
# Agent notification arrived with error or incomplete result
# (Original was: Task(..., run_in_background=True))

if result.failed or result.incomplete:
    # Log the failure
    TaskUpdate(taskId="3", addComment={
        "author": "orchestrator",
        "content": f"Attempt 1 failed: {result.error}. Retrying with adjusted approach."
    })

    # Retry with more context (still background, same model as original)
    Task(subagent_type="general-purpose",
         prompt=f"""Previous attempt failed: {result.error}

         Try alternative approach:
         - [specific guidance based on failure]

         Original task: [task description]""",
         model="sonnet",
         run_in_background=True)
```

### Escalation Rules

1. **After 2 failed retries** → Ask user for guidance
2. **If dependency failed** → Mark dependent tasks as blocked, surface to user
3. **If conflict detected** → Pause parallel work, resolve, then continue

### Partial Success Handling

```python
# Agent completed some but not all work
TaskUpdate(taskId="3", status="resolved",
           addComment={"author": "orchestrator",
                       "content": "Partial: Completed X and Y, but Z needs separate handling"})

# Create new task for remaining work
TaskCreate(subject="Complete remaining Z work",
           description="Agent completed X and Y but Z still needs...")
```

---

## Result Synthesis

After parallel agents complete, synthesize their outputs into coherent results.

### Synthesis Patterns

| Pattern                  | How to Synthesize                                                        |
| ------------------------ | ------------------------------------------------------------------------ |
| Multi-dimensional review | Merge by severity, dedupe findings, format as unified review             |
| Parallel exploration     | Combine file lists, identify overlaps, structure by area                 |
| Parallel implementation  | Check for conflicts, verify integration points, summarize what was built |
| Competing approaches     | Compare results, select winner, explain rationale                        |

### Collection

```python
# Wait for all background agents
result1 = TaskOutput(task_id="agent-1")
result2 = TaskOutput(task_id="agent-2")
result3 = TaskOutput(task_id="agent-3")
```

### Aggregation Approaches

**Simple aggregation (orchestrator does it):**

```python
# Combine exploration results
all_files = set()
for result in [result1, result2, result3]:
    all_files.update(result.files_found)

# Present unified list
"Found these relevant files: {all_files}"
```

**Complex synthesis (spawn synthesis agent - opus for judgment):**

```
Task(subagent_type="general-purpose",
     prompt=f"""Synthesize these parallel review findings into a unified report:

Security review findings:
{result1}

Performance review findings:
{result2}

Code quality findings:
{result3}

Create a single PR review with:
- Summary
- Risk assessment (security/performance/breaking)
- Must-fix items (blocking)
- Should-fix items (non-blocking)
- Positive notes

Prioritize by severity. Remove duplicates. Do not mention that multiple reviews were conducted.""",
     model="opus",
     run_in_background=True)
```

### Conflict Resolution

When parallel agents produce conflicting outputs:

```python
# Detect conflict (e.g., both modified same file)
if has_conflict(result1, result2):
    # Option 1: Present both to user
    "Two approaches were attempted. Which do you prefer?
     Approach A: {result1.summary}
     Approach B: {result2.summary}"

    # Option 2: Spawn resolution agent (opus for judgment)
    Task(subagent_type="general-purpose",
         prompt=f"""Two agents produced conflicting changes:

         Agent 1: {result1}
         Agent 2: {result2}

         Merge these changes, resolving conflicts by [priority rule].
         Ensure the final result is consistent.""",
         model="opus",
         run_in_background=True)
```

### Communication

When presenting synthesized results to users:

- **Lead with conclusion** - Summary first, details after
- **Group by theme** - Not by agent or source
- **Hide the machinery** - Don't mention "3 agents analyzed this"
- **Present as unified analysis** - "Here's what I found" not "Agent 1 found X, Agent 2 found Y"

---

```
─── ◈ Patterns Reference Complete ───────
```
