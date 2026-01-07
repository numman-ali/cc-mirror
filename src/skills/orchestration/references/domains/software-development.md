# Software Development Orchestration Patterns

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   Building software is what we do best.                     │
│   Features, fixes, refactors — all orchestrated elegantly.  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

> **Load when**: Feature implementation, bug fixes, refactoring, migrations, greenfield development
> **Common patterns**: Plan-Parallel-Integrate, Diagnose-Hypothesize-Fix, Map-Analyze-Transform

## Table of Contents

1. [Feature Implementation](#feature-implementation)
2. [Bug Fixing](#bug-fixing)
3. [Refactoring](#refactoring)
4. [Migration](#migration)
5. [Greenfield Development](#greenfield-development)

---

## Feature Implementation

### Pattern: Plan-Parallel-Integrate

```
User Request: "Add user authentication"

Phase 1: PIPELINE (Research → Plan)
├─ Explore agent: Find existing auth patterns, user models, middleware
└─ Plan agent: Design auth architecture using findings

Phase 2: FAN-OUT (Parallel Implementation)
├─ Agent A: Implement user model + database schema
├─ Agent B: Implement JWT/session middleware
├─ Agent C: Implement login/logout routes
└─ Agent D: Implement frontend auth components

Phase 3: PIPELINE (Integration)
└─ General-purpose agent: Wire components, add tests, verify flow
```

**Task breakdown:**

```
TaskCreate("Design authentication architecture")
TaskCreate("Implement user model and schema")
TaskCreate("Build auth middleware")
TaskCreate("Create auth API routes")
TaskCreate("Build frontend auth UI")
TaskCreate("Integration testing")

# Dependencies
Task 2-5 blocked by Task 1
Task 6 blocked by Tasks 2-5
```

### Pattern: Vertical Slice

For full-stack features, implement one complete slice first:

```
Phase 1: Single complete flow
└─ General-purpose agent: DB → API → UI for one use case

Phase 2: FAN-OUT expansion
├─ Agent A: Additional DB operations
├─ Agent B: Additional API endpoints
└─ Agent C: Additional UI components
```

---

## Bug Fixing

### Pattern: Diagnose-Hypothesize-Fix

```
User Request: "Users can't log in after password reset"

Phase 1: FAN-OUT (Parallel Diagnosis)
├─ Explore agent: Search error logs, recent changes to auth
├─ Explore agent: Find password reset flow implementation
└─ Explore agent: Check session/token handling

Phase 2: PIPELINE (Analysis)
└─ General-purpose agent: Synthesize findings, form hypotheses

Phase 3: SPECULATIVE (If cause unclear)
├─ Agent A: Test hypothesis 1 (token expiry issue)
├─ Agent B: Test hypothesis 2 (session invalidation)
└─ Agent C: Test hypothesis 3 (password hash mismatch)

Phase 4: PIPELINE
└─ General-purpose agent: Implement fix, add regression test
```

### Pattern: Reproduction-First

```
Phase 1: Reproduce
└─ General-purpose agent: Create minimal reproduction case

Phase 2: Bisect (if needed)
└─ Background agent: Git bisect to find breaking commit

Phase 3: Fix
└─ General-purpose agent: Implement and verify fix
```

---

## Refactoring

### Pattern: Map-Analyze-Transform

```
User Request: "Refactor callback-based code to async/await"

Phase 1: MAP (Find all instances)
└─ Explore agent: Find all callback patterns in codebase

Phase 2: FAN-OUT (Analyze impact)
├─ Agent A: Analyze module A dependencies
├─ Agent B: Analyze module B dependencies
└─ Agent C: Analyze module C dependencies

Phase 3: PIPELINE (Safe transformation)
├─ Plan agent: Design migration order (leaf nodes first)
└─ General-purpose agent: Transform files in dependency order
```

### Pattern: Strangler Fig

For large refactors, wrap old with new:

```
Phase 1: Create parallel implementation
├─ Agent A: Build new abstraction layer
└─ Agent B: Implement new pattern alongside old

Phase 2: Gradual migration
└─ General-purpose agents: Migrate consumers one by one

Phase 3: Cleanup
└─ General-purpose agent: Remove old implementation
```

---

## Migration

### Pattern: Schema-Data-Code

```
User Request: "Migrate from MongoDB to PostgreSQL"

Phase 1: FAN-OUT (Analysis)
├─ Explore agent: Document all MongoDB schemas
├─ Explore agent: Find all database queries
└─ Explore agent: Identify data transformation needs

Phase 2: PIPELINE (Schema)
└─ General-purpose agent: Create PostgreSQL schemas, migrations

Phase 3: FAN-OUT (Code updates)
├─ Agent A: Update user-related queries
├─ Agent B: Update product-related queries
└─ Agent C: Update order-related queries

Phase 4: PIPELINE (Data migration)
└─ General-purpose agent: Write and run data migration scripts
```

### Pattern: Version Upgrade

```
User Request: "Upgrade React from v17 to v18"

Phase 1: EXPLORE
└─ Explore agent: Find breaking changes, deprecated APIs used

Phase 2: MAP-REDUCE
├─ Agent A: Update component files batch 1
├─ Agent B: Update component files batch 2
└─ Agent C: Update component files batch 3
→ Aggregate: Collect all breaking changes found

Phase 3: PIPELINE
├─ General-purpose agent: Fix breaking changes
└─ Background agent: Run full test suite
```

---

## Greenfield Development

### Pattern: Scaffold-Parallel-Integrate

```
User Request: "Build a REST API for task management"

Phase 1: PIPELINE (Foundation)
├─ Plan agent: Design API architecture, endpoints, data models
└─ General-purpose agent: Scaffold project, setup tooling

Phase 2: FAN-OUT (Core features)
├─ Agent A: User management (model, routes, auth)
├─ Agent B: Task CRUD operations
├─ Agent C: Project/workspace management
└─ Agent D: Shared middleware, utilities

Phase 3: FAN-OUT (Cross-cutting)
├─ Agent A: Error handling, validation
├─ Agent B: Logging, monitoring setup
└─ Agent C: API documentation

Phase 4: PIPELINE (Polish)
└─ General-purpose agent: Integration tests, final wiring
```

### Pattern: MVP-First

```
Phase 1: Minimal viable implementation
└─ General-purpose agent: End-to-end flow, minimal features

Phase 2: BACKGROUND (Feedback loop)
├─ User testing while...
└─ Background agents prepare next features

Phase 3: FAN-OUT (Feature expansion)
├─ Multiple agents expand different features in parallel
```

---

## Task Management Integration

For any software development task, create explicit tasks:

```python
# Decompose the work
TaskCreate(subject="Analyze requirements", description="Understand codebase patterns, existing code...")
TaskCreate(subject="Design approach", description="Plan implementation strategy...")
TaskCreate(subject="Implement core functionality", description="Build the main feature...")
TaskCreate(subject="Add error handling", description="Handle edge cases, validation...")
TaskCreate(subject="Write tests", description="Unit and integration tests...")

# Set dependencies
TaskUpdate(taskId="2", addBlockedBy=["1"])  # Design after analysis
TaskUpdate(taskId="3", addBlockedBy=["2"])  # Implement after design
TaskUpdate(taskId="4", addBlockedBy=["3"])  # Error handling after core
TaskUpdate(taskId="5", addBlockedBy=["3"])  # Tests can parallel with error handling

# Spawn agents for unblocked tasks (haiku for analysis/exploration)
Task(subagent_type="Explore", prompt="TaskId 1: Analyze requirements...",
     model="haiku", run_in_background=True)
```

Agents mark tasks resolved immediately upon completion.

---

```
─── ◈ Software Development ─────────────
```
