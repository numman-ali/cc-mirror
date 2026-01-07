# Documentation Orchestration Patterns

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   Good documentation is parallel-friendly.                  │
│   Multiple sections, generated simultaneously.              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

> **Load when**: API documentation, code documentation, README generation, architecture docs, user guides
> **Common patterns**: Endpoint Discovery, Batch JSDoc Generation, Comprehensive README

## Table of Contents

1. [API Documentation](#api-documentation)
2. [Code Documentation](#code-documentation)
3. [README Generation](#readme-generation)
4. [Architecture Documentation](#architecture-documentation)
5. [User Guides](#user-guides)

---

## API Documentation

### Pattern: Endpoint Discovery and Documentation

```
User Request: "Document all REST API endpoints"

Phase 1: EXPLORE
└─ Explore agent: Find all route definitions

Phase 2: FAN-OUT (Parallel documentation by domain)
├─ Agent A: Document auth endpoints
├─ Agent B: Document user endpoints
├─ Agent C: Document product endpoints
└─ Agent D: Document order endpoints

Phase 3: REDUCE
└─ General-purpose agent: Compile into unified OpenAPI/Swagger spec
```

### Pattern: Request/Response Documentation

```
Phase 1: EXPLORE
└─ Explore agent: Find endpoint handlers and schemas

Phase 2: FAN-OUT (Per endpoint group)
├─ Agent A: Document request schemas, validation
├─ Agent B: Document response schemas, status codes
└─ Agent C: Document error responses

Phase 3: PIPELINE
└─ General-purpose agent: Generate examples, test payloads
```

### Pattern: Interactive Documentation

```
Phase 1: PIPELINE (Foundation)
├─ Explore agent: Extract all endpoints with types
└─ General-purpose agent: Generate OpenAPI spec

Phase 2: FAN-OUT (Enhancement)
├─ Agent A: Add example requests
├─ Agent B: Add example responses
└─ Agent C: Add authentication examples

Phase 3: PIPELINE
└─ General-purpose agent: Setup Swagger UI / Redoc
```

---

## Code Documentation

### Pattern: Batch JSDoc/Docstring Generation

```
User Request: "Add documentation to the utils module"

Phase 1: EXPLORE
└─ Explore agent: Find all undocumented functions

Phase 2: MAP (Parallel documentation)
├─ Agent A: Document file1.ts functions
├─ Agent B: Document file2.ts functions
└─ Agent C: Document file3.ts functions

Phase 3: PIPELINE
└─ General-purpose agent: Verify consistency, generate type docs
```

### Pattern: Complexity-Driven Documentation

```
Phase 1: EXPLORE
└─ Explore agent: Find complex functions (high cyclomatic complexity)

Phase 2: FAN-OUT (Prioritized)
├─ Agent A: Document most complex function
├─ Agent B: Document second most complex
└─ Agent C: Document third most complex

Each agent:
- Explain algorithm/logic
- Document edge cases
- Add usage examples
```

### Pattern: Module Overview Generation

```
Phase 1: EXPLORE
└─ Explore agent: Map module structure, exports, dependencies

Phase 2: PIPELINE
├─ General-purpose agent: Write module overview
├─ General-purpose agent: Document public API
└─ General-purpose agent: Add usage examples

Phase 3: FAN-OUT (Internal docs)
├─ Agent A: Document internal utilities
└─ Agent B: Document configuration options
```

---

## README Generation

### Pattern: Comprehensive README

```
User Request: "Create a README for this project"

Phase 1: FAN-OUT (Parallel information gathering)
├─ Explore agent: Project structure and technologies
├─ Explore agent: Build and run scripts (package.json, Makefile)
├─ Explore agent: Environment variables and config
├─ Explore agent: Test setup and commands
└─ Explore agent: Existing docs and comments

Phase 2: REDUCE
└─ General-purpose agent: Synthesize into structured README

Sections:
- Overview and purpose
- Quick start
- Installation
- Configuration
- Usage examples
- Development setup
- Testing
- Contributing
```

### Pattern: README Update

```
Phase 1: FAN-OUT
├─ Explore agent: Current README content
├─ Explore agent: Recent changes to codebase
└─ Explore agent: New dependencies or features

Phase 2: PIPELINE
└─ General-purpose agent: Update README sections, maintain style
```

---

## Architecture Documentation

### Pattern: C4 Model Documentation

```
User Request: "Document the system architecture"

Phase 1: FAN-OUT (Parallel level documentation)
├─ Agent A: Context diagram (system + external actors)
├─ Agent B: Container diagram (applications, data stores)
├─ Agent C: Component diagram (internal components)
└─ Agent D: Code diagram (critical classes/modules)

Phase 2: REDUCE
└─ General-purpose agent: Compile into architecture doc with diagrams
```

### Pattern: Decision Record Generation

```
Phase 1: EXPLORE
└─ Explore agent: Find architectural patterns in code

Phase 2: FAN-OUT
├─ Agent A: Document decision 1 (why this database?)
├─ Agent B: Document decision 2 (why this framework?)
└─ Agent C: Document decision 3 (why this structure?)

Each ADR includes:
- Context
- Decision
- Consequences
- Alternatives considered
```

### Pattern: Data Flow Documentation

```
Phase 1: EXPLORE
└─ Explore agent: Trace data through system

Phase 2: PIPELINE
├─ General-purpose agent: Document ingress points
├─ General-purpose agent: Document transformations
├─ General-purpose agent: Document storage
└─ General-purpose agent: Document egress points

Phase 3: REDUCE
└─ General-purpose agent: Create data flow diagram
```

---

## User Guides

### Pattern: Feature-Based Guides

```
User Request: "Write user documentation for the dashboard"

Phase 1: EXPLORE
└─ Explore agent: Map dashboard features and capabilities

Phase 2: FAN-OUT (Parallel feature guides)
├─ Agent A: Guide for feature 1 (with screenshots)
├─ Agent B: Guide for feature 2
├─ Agent C: Guide for feature 3
└─ Agent D: Troubleshooting guide

Phase 3: REDUCE
└─ General-purpose agent: Compile into user manual with TOC
```

### Pattern: Tutorial Generation

```
Phase 1: EXPLORE
└─ Explore agent: Identify key user workflows

Phase 2: PIPELINE (Sequential tutorials)
├─ General-purpose agent: Getting started tutorial
├─ General-purpose agent: Basic usage tutorial
├─ General-purpose agent: Advanced usage tutorial
└─ General-purpose agent: Best practices guide
```

### Pattern: FAQ Generation

```
Phase 1: FAN-OUT
├─ Explore agent: Common patterns in issues/tickets
├─ Explore agent: Error messages and their causes
└─ Explore agent: Configuration gotchas

Phase 2: REDUCE
└─ General-purpose agent: Compile FAQ with clear answers
```

---

## Documentation Quality Patterns

### Pattern: Consistency Audit

```
Phase 1: FAN-OUT
├─ Agent A: Check terminology consistency
├─ Agent B: Check formatting consistency
├─ Agent C: Check example code validity
└─ Agent D: Check link validity

Phase 2: REDUCE
└─ General-purpose agent: Inconsistency report with fixes
```

### Pattern: Freshness Check

```
Phase 1: FAN-OUT
├─ Explore agent: Find outdated code examples
├─ Explore agent: Find references to removed features
└─ Explore agent: Find mismatched version numbers

Phase 2: PIPELINE
└─ General-purpose agent: Update stale documentation
```

---

## Task Management for Documentation

Structure documentation work with parallel generation:

```python
# Create documentation tasks
TaskCreate(subject="Audit existing docs", description="Review current documentation state...")
TaskCreate(subject="Document API endpoints", description="REST API documentation...")
TaskCreate(subject="Document components", description="React component docs...")
TaskCreate(subject="Document utilities", description="Helper function docs...")
TaskCreate(subject="Review consistency", description="Ensure consistent style...")
TaskCreate(subject="Verify examples", description="Test all code examples...")

# Parallel doc generation after audit
TaskUpdate(taskId="2", addBlockedBy=["1"])
TaskUpdate(taskId="3", addBlockedBy=["1"])
TaskUpdate(taskId="4", addBlockedBy=["1"])
TaskUpdate(taskId="5", addBlockedBy=["2", "3", "4"])
TaskUpdate(taskId="6", addBlockedBy=["5"])

# Spawn parallel documentation agents (sonnet for well-structured work)
Task(subagent_type="general-purpose", prompt="TaskId 2: Document API endpoints...",
     model="sonnet", run_in_background=True)
Task(subagent_type="general-purpose", prompt="TaskId 3: Document components...",
     model="sonnet", run_in_background=True)
Task(subagent_type="general-purpose", prompt="TaskId 4: Document utilities...",
     model="sonnet", run_in_background=True)
```

## Output Formats

| Doc Type     | Format              | Tool                   |
| ------------ | ------------------- | ---------------------- |
| API docs     | OpenAPI/Swagger     | YAML/JSON              |
| Code docs    | JSDoc/docstrings    | Inline                 |
| READMEs      | Markdown            | .md files              |
| Architecture | Markdown + diagrams | Mermaid/PlantUML       |
| User guides  | Markdown/HTML       | Static site generators |

---

```
─── ◈ Documentation ─────────────────────
```
