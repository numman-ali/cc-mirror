# Research Orchestration Patterns

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   Discovery is where great work begins.                     │
│   Explore broadly, synthesize clearly, answer confidently.  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

> **Load when**: Codebase exploration, technical investigation, dependency analysis, documentation research
> **Common patterns**: Breadth-First Discovery, Feature Tracing, Root Cause Analysis

## Table of Contents

1. [Codebase Exploration](#codebase-exploration)
2. [Technical Investigation](#technical-investigation)
3. [Dependency Analysis](#dependency-analysis)
4. [Documentation Research](#documentation-research)
5. [Competitive Analysis](#competitive-analysis)

---

## Codebase Exploration

### Pattern: Breadth-First Discovery

```
User Request: "Help me understand this codebase"

Phase 1: FAN-OUT (Parallel surface scan)
├─ Explore agent: Project structure, entry points
├─ Explore agent: Package.json/requirements/build files
├─ Explore agent: README, docs folder
└─ Explore agent: Test structure and patterns

Phase 2: REDUCE
└─ General-purpose agent: Synthesize codebase overview

Phase 3: FAN-OUT (Deep dive areas of interest)
├─ Explore agent: Deep dive area 1
├─ Explore agent: Deep dive area 2
└─ Explore agent: Deep dive area 3
```

### Pattern: Feature Tracing

```
User Request: "How does user authentication work?"

Phase 1: EXPLORE
└─ Explore agent: Find auth-related files (grep patterns)

Phase 2: PIPELINE (Follow the flow)
├─ Explore agent: Entry point (login route/component)
├─ Explore agent: Middleware/validation layer
├─ Explore agent: Session/token handling
└─ Explore agent: Database/storage layer

Phase 3: REDUCE
└─ General-purpose agent: Document complete auth flow
```

### Pattern: Impact Analysis

```
User Request: "What would break if I change UserService?"

Phase 1: EXPLORE
└─ Explore agent: Find UserService definition and interface

Phase 2: FAN-OUT
├─ Explore agent: Find all imports of UserService
├─ Explore agent: Find all usages of each method
└─ Explore agent: Find tests depending on UserService

Phase 3: REDUCE
└─ General-purpose agent: Impact report with risk assessment
```

---

## Technical Investigation

### Pattern: Root Cause Analysis

```
User Request: "Why is the API slow?"

Phase 1: FAN-OUT (Parallel hypothesis generation)
├─ Explore agent: Check database query patterns
├─ Explore agent: Check API middleware chain
├─ Explore agent: Check external service calls
└─ Explore agent: Check caching implementation

Phase 2: REDUCE
└─ General-purpose agent: Ranked hypotheses with evidence

Phase 3: PIPELINE (Validate top hypothesis)
└─ General-purpose agent: Instrument/test to confirm
```

### Pattern: Technology Evaluation

```
User Request: "Should we use Redis or Memcached?"

Phase 1: FAN-OUT (Parallel research)
├─ Agent A (WebSearch): Redis features, use cases, benchmarks
├─ Agent B (WebSearch): Memcached features, use cases, benchmarks
└─ Explore agent: Current caching patterns in codebase

Phase 2: REDUCE
└─ Plan agent: Comparison matrix, recommendation with rationale
```

### Pattern: Bug Archaeology

```
User Request: "When did this bug get introduced?"

Phase 1: EXPLORE
└─ Explore agent: Identify relevant files and functions

Phase 2: BACKGROUND
└─ Background agent: Git bisect or log analysis

Phase 3: PIPELINE
└─ General-purpose agent: Timeline of changes, root cause commit
```

---

## Dependency Analysis

### Pattern: Dependency Graph

```
User Request: "Map all dependencies for the auth module"

Phase 1: EXPLORE
└─ Explore agent: Find auth module entry points

Phase 2: FAN-OUT (Parallel tracing)
├─ Explore agent: Trace internal dependencies
├─ Explore agent: Trace external package dependencies
└─ Explore agent: Trace database/service dependencies

Phase 3: REDUCE
└─ General-purpose agent: Dependency graph visualization
```

### Pattern: Upgrade Impact

```
User Request: "What happens if we upgrade lodash?"

Phase 1: FAN-OUT
├─ Explore agent: Find all lodash usages
├─ Agent (WebSearch): lodash changelog, breaking changes
└─ Explore agent: Find tests covering lodash functionality

Phase 2: REDUCE
└─ General-purpose agent: Impact assessment, migration guide
```

### Pattern: Dead Code Detection

```
Phase 1: EXPLORE
└─ Explore agent: Build export/import graph

Phase 2: FAN-OUT
├─ Explore agent: Find unreferenced exports
├─ Explore agent: Find unused internal functions
└─ Explore agent: Find commented/disabled code

Phase 3: REDUCE
└─ General-purpose agent: Dead code report with safe removal list
```

---

## Documentation Research

### Pattern: API Discovery

```
User Request: "Document all API endpoints"

Phase 1: EXPLORE
└─ Explore agent: Find route definitions (express routes, decorators, etc.)

Phase 2: MAP (Per endpoint)
├─ Agent A: Document endpoint group 1 (params, responses)
├─ Agent B: Document endpoint group 2
└─ Agent C: Document endpoint group 3

Phase 3: REDUCE
└─ General-purpose agent: Unified API documentation
```

### Pattern: Cross-Reference

```
User Request: "Find all documentation for the payment system"

Phase 1: FAN-OUT
├─ Explore agent: Search code comments
├─ Explore agent: Search markdown files
├─ Explore agent: Search wiki/confluence (if accessible)
└─ Explore agent: Search inline JSDoc/docstrings

Phase 2: REDUCE
└─ General-purpose agent: Consolidated documentation index
```

---

## Competitive Analysis

### Pattern: Feature Comparison

```
User Request: "Compare our auth to Auth0"

Phase 1: FAN-OUT
├─ Explore agent: Document our auth capabilities
├─ Agent (WebSearch): Auth0 features and pricing
└─ Agent (WebSearch): Auth0 limitations and reviews

Phase 2: REDUCE
└─ Plan agent: Feature matrix, gap analysis
```

### Pattern: Best Practices Research

```
User Request: "What are best practices for rate limiting?"

Phase 1: FAN-OUT
├─ Agent (WebSearch): Industry rate limiting patterns
├─ Agent (WebSearch): Framework-specific implementations
├─ Explore agent: Current rate limiting in codebase
└─ Agent (WebSearch): Case studies and failure modes

Phase 2: REDUCE
└─ General-purpose agent: Best practices guide with recommendations
```

---

## Research Output Formats

### Investigation Report Template

```markdown
## Question

[Original question/request]

## Summary

[1-2 sentence answer]

## Evidence

1. [Finding 1 with file:line references]
2. [Finding 2 with file:line references]

## Analysis

[Interpretation of evidence]

## Recommendations

1. [Actionable recommendation]

## Open Questions

- [What wasn't answered]
```

### Task Management for Research

For research tasks, structure as exploration followed by synthesis:

```python
# Create research tasks
TaskCreate(subject="Define research scope", description="Clarify questions, identify sources...")
TaskCreate(subject="Explore area 1", description="Search for patterns in auth module...")
TaskCreate(subject="Explore area 2", description="Search for patterns in API layer...")
TaskCreate(subject="Explore area 3", description="Search for patterns in database...")
TaskCreate(subject="Synthesize findings", description="Aggregate discoveries, form conclusions...")

# Exploration can run in parallel, synthesis waits
TaskUpdate(taskId="2", addBlockedBy=["1"])
TaskUpdate(taskId="3", addBlockedBy=["1"])
TaskUpdate(taskId="4", addBlockedBy=["1"])
TaskUpdate(taskId="5", addBlockedBy=["2", "3", "4"])

# Spawn Explore agents in parallel (haiku swarm for fast exploration)
Task(subagent_type="Explore", prompt="TaskId 2: Find auth patterns...",
     model="haiku", run_in_background=True)
Task(subagent_type="Explore", prompt="TaskId 3: Find API patterns...",
     model="haiku", run_in_background=True)
Task(subagent_type="Explore", prompt="TaskId 4: Find database patterns...",
     model="haiku", run_in_background=True)
```

## Agent Selection for Research

| Research Type      | Primary Agent      | Secondary Agents                |
| ------------------ | ------------------ | ------------------------------- |
| Codebase questions | Explore            | General-purpose for synthesis   |
| External research  | WebSearch-enabled  | Explore for local context       |
| Architecture       | Plan               | Explore for discovery           |
| Impact analysis    | Explore (parallel) | General-purpose for aggregation |

---

```
─── ◈ Research ──────────────────────────
```
