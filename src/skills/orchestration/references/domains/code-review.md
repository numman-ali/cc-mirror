# Code Review Orchestration Patterns

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   Reviews should be thorough, fast, and actionable.         │
│   Parallel analysis. Unified feedback. Clear priorities.    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

> **Load when**: PR review, security audit, performance review, architecture review, pre-merge validation
> **Common patterns**: Multi-Dimensional Analysis, OWASP-Parallel, Layer-by-Layer

## Table of Contents

1. [Pull Request Review](#pull-request-review)
2. [Security Audit](#security-audit)
3. [Performance Review](#performance-review)
4. [Architecture Review](#architecture-review)
5. [Pre-merge Validation](#pre-merge-validation)

---

## Pull Request Review

### Pattern: Multi-Dimensional Analysis

```
User Request: "Review PR #123"

Phase 1: FAN-OUT (Parallel analysis dimensions)
├─ Explore agent: Understand PR context, related issues
├─ Agent A: Code quality analysis (style, patterns, DRY)
├─ Agent B: Logic correctness (edge cases, error handling)
├─ Agent C: Security implications
└─ Agent D: Performance implications

Phase 2: REDUCE (Synthesize)
└─ General-purpose agent: Aggregate findings, prioritize, format review
```

**Implementation:**

```
# All in single message for parallelism (opus for reviews - critical thinking)
Task(subagent_type="Explore", prompt="Fetch PR #123 details, understand context and related issues",
     model="haiku", run_in_background=True)
Task(subagent_type="general-purpose", prompt="Review code quality: patterns, readability, maintainability",
     model="opus", run_in_background=True)
Task(subagent_type="general-purpose", prompt="Review logic: correctness, edge cases, error handling",
     model="opus", run_in_background=True)
Task(subagent_type="general-purpose", prompt="Review security: injection, auth, data exposure",
     model="opus", run_in_background=True)
Task(subagent_type="general-purpose", prompt="Review performance: complexity, queries, memory",
     model="opus", run_in_background=True)
```

### Pattern: Contextual Deep-Dive

```
Phase 1: PIPELINE (Understand)
├─ Explore agent: Get PR diff, commit messages
└─ Explore agent: Find related code, understand impact

Phase 2: FAN-OUT (File-by-file)
├─ Agent per changed file (for large PRs)

Phase 3: PIPELINE (Consolidate)
└─ General-purpose agent: Create cohesive review
```

---

## Security Audit

### Pattern: OWASP-Parallel

```
User Request: "Security audit the authentication module"

Phase 1: FAN-OUT (OWASP categories in parallel)
├─ Agent A: Injection vulnerabilities (SQL, command, XSS)
├─ Agent B: Authentication/session issues
├─ Agent C: Access control problems
├─ Agent D: Cryptographic weaknesses
├─ Agent E: Data exposure risks
└─ Agent F: Security misconfiguration

Phase 2: REDUCE
└─ General-purpose agent: Risk-ranked findings with remediation
```

### Pattern: Attack Surface Mapping

```
Phase 1: EXPLORE
└─ Explore agent: Map all entry points (APIs, forms, file uploads)

Phase 2: FAN-OUT (Per entry point)
├─ Agent per entry point: Analyze input validation, sanitization

Phase 3: PIPELINE
└─ General-purpose agent: Threat model, prioritized vulnerabilities
```

### Pattern: Dependency Audit

```
Phase 1: FAN-OUT
├─ Agent A: Scan npm/pip dependencies for CVEs
├─ Agent B: Check for outdated packages
└─ Agent C: Analyze transitive dependencies

Phase 2: REDUCE
└─ General-purpose agent: Prioritized upgrade plan
```

---

## Performance Review

### Pattern: Layer-by-Layer

```
User Request: "Find performance bottlenecks"

Phase 1: FAN-OUT (Analyze each layer)
├─ Agent A: Database queries (N+1, missing indexes, slow queries)
├─ Agent B: API layer (response times, payload sizes)
├─ Agent C: Frontend (bundle size, render performance)
└─ Agent D: Infrastructure (caching, connection pooling)

Phase 2: REDUCE
└─ General-purpose agent: Prioritized optimization roadmap
```

### Pattern: Hot Path Analysis

```
Phase 1: EXPLORE
└─ Explore agent: Identify critical user flows

Phase 2: PIPELINE (Per flow)
└─ General-purpose agent: Trace request lifecycle, find bottlenecks

Phase 3: FAN-OUT (Optimization)
├─ Agent per bottleneck: Implement optimization
```

### Pattern: Complexity Audit

```
Phase 1: MAP
└─ Explore agent: Find all functions, measure complexity

Phase 2: FAN-OUT (High complexity functions)
├─ Agent A: Analyze function X, suggest optimizations
├─ Agent B: Analyze function Y, suggest optimizations
└─ Agent C: Analyze function Z, suggest optimizations
```

---

## Architecture Review

### Pattern: Multi-Stakeholder

```
User Request: "Review system architecture"

Phase 1: FAN-OUT (Perspectives)
├─ Agent A: Scalability assessment
├─ Agent B: Maintainability assessment
├─ Agent C: Security architecture
├─ Agent D: Cost efficiency
└─ Agent E: Developer experience

Phase 2: REDUCE
└─ Plan agent: Synthesize into architecture decision record
```

### Pattern: Dependency Analysis

```
Phase 1: EXPLORE
└─ Explore agent: Map all module dependencies

Phase 2: FAN-OUT
├─ Agent A: Identify circular dependencies
├─ Agent B: Find coupling hotspots
└─ Agent C: Assess abstraction boundaries

Phase 3: PIPELINE
└─ Plan agent: Recommend architectural improvements
```

### Pattern: Standards Compliance

```
Phase 1: FAN-OUT
├─ Agent A: Check against SOLID principles
├─ Agent B: Check against team style guide
├─ Agent C: Check against industry patterns
└─ Agent D: Check against regulatory requirements

Phase 2: REDUCE
└─ General-purpose agent: Compliance report with gaps
```

---

## Pre-merge Validation

### Pattern: Comprehensive Gate

```
User Request: "Validate PR ready for merge"

Phase 1: FAN-OUT (All checks in parallel)
├─ Background agent: Run full test suite
├─ Agent A: Verify all review comments addressed
├─ Agent B: Check for merge conflicts
├─ Agent C: Validate documentation updated
└─ Agent D: Confirm CI checks passing

Phase 2: REDUCE
└─ General-purpose agent: Go/no-go recommendation with blockers
```

### Pattern: Regression Check

```
Phase 1: EXPLORE
└─ Explore agent: Identify areas affected by changes

Phase 2: FAN-OUT
├─ Agent A: Test affected area 1
├─ Agent B: Test affected area 2
└─ Agent C: Integration test critical paths

Phase 3: PIPELINE
└─ General-purpose agent: Regression report
```

---

## Review Output Formats

### Structured Review Template

```markdown
## Summary

[1-2 sentence overview]

## Risk Assessment

- **Security**: Low/Medium/High
- **Performance**: Low/Medium/High
- **Breaking Changes**: Yes/No

## Must Fix (Blocking)

1. [Critical issue with line reference]

## Should Fix (Non-blocking)

1. [Important improvement]

## Consider (Optional)

1. [Nice-to-have suggestion]

## Positive Notes

- [What was done well]
```

### Task Management for Reviews

For comprehensive reviews, create parallel analysis tasks:

```python
# Create review tasks (can run in parallel)
TaskCreate(subject="Analyze PR context", description="Understand changes, related issues...")
TaskCreate(subject="Review code quality", description="Patterns, readability, maintainability...")
TaskCreate(subject="Check security", description="Injection, auth, data exposure...")
TaskCreate(subject="Assess performance", description="Complexity, queries, memory...")
TaskCreate(subject="Synthesize review", description="Aggregate findings into review...")

# Synthesis blocked by analysis tasks
TaskUpdate(taskId="5", addBlockedBy=["1", "2", "3", "4"])

# Spawn parallel agents for analysis (opus for reviews - critical thinking)
Task(subagent_type="Explore", prompt="TaskId 1: Analyze PR context...",
     model="haiku", run_in_background=True)
Task(subagent_type="general-purpose", prompt="TaskId 2: Review code quality...",
     model="opus", run_in_background=True)
Task(subagent_type="general-purpose", prompt="TaskId 3: Check security...",
     model="opus", run_in_background=True)
Task(subagent_type="general-purpose", prompt="TaskId 4: Assess performance...",
     model="opus", run_in_background=True)
```

---

```
─── ◈ Code Review ───────────────────────
```
