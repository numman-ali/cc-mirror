# Testing Orchestration Patterns

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   Confidence through verification.                          │
│   Generate, execute, analyze — all in parallel.             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

> **Load when**: Test generation, test execution, coverage analysis, test maintenance, E2E testing
> **Common patterns**: Coverage-Driven Generation, Parallel Test Suites, Broken Test Triage

## Table of Contents

1. [Test Generation](#test-generation)
2. [Test Execution](#test-execution)
3. [Coverage Analysis](#coverage-analysis)
4. [Test Maintenance](#test-maintenance)
5. [E2E Testing](#e2e-testing)

---

## Test Generation

### Pattern: Coverage-Driven Generation

```
User Request: "Add tests for the UserService"

Phase 1: EXPLORE
└─ Explore agent: Understand UserService methods, dependencies

Phase 2: FAN-OUT (Parallel test writing)
├─ Agent A: Unit tests for method group 1
├─ Agent B: Unit tests for method group 2
├─ Agent C: Integration tests for external dependencies
└─ Agent D: Edge cases and error scenarios

Phase 3: PIPELINE
└─ General-purpose agent: Verify tests pass, check coverage
```

### Pattern: Behavior-First

```
User Request: "Test the checkout flow"

Phase 1: EXPLORE
└─ Explore agent: Map checkout flow steps and branches

Phase 2: PIPELINE (Generate by behavior)
├─ General-purpose agent: Happy path tests
├─ General-purpose agent: Error path tests
└─ General-purpose agent: Edge case tests

Phase 3: BACKGROUND
└─ Background agent: Run tests, report results
```

### Pattern: Contract Testing

```
User Request: "Add API contract tests"

Phase 1: EXPLORE
└─ Explore agent: Document API endpoints and schemas

Phase 2: FAN-OUT
├─ Agent A: Request validation tests
├─ Agent B: Response schema tests
└─ Agent C: Error response tests

Phase 3: PIPELINE
└─ General-purpose agent: Integrate with CI, add OpenAPI validation
```

---

## Test Execution

### Pattern: Parallel Test Suites

```
User Request: "Run all tests"

Phase 1: FAN-OUT (Parallel suites)
├─ Background agent: Unit tests
├─ Background agent: Integration tests
├─ Background agent: E2E tests
└─ Background agent: Performance tests

Phase 2: REDUCE
└─ General-purpose agent: Aggregate results, identify failures
```

### Pattern: Targeted Execution

```
User Request: "Test the changes I made"

Phase 1: EXPLORE
└─ Explore agent: Identify changed files and affected tests

Phase 2: FAN-OUT
├─ Background agent: Run directly affected tests
└─ Background agent: Run dependent module tests

Phase 3: PIPELINE
└─ General-purpose agent: Report results, suggest additional tests
```

### Pattern: Flaky Test Detection

```
Phase 1: BACKGROUND (Multiple runs)
├─ Background agent: Run test suite (run 1)
├─ Background agent: Run test suite (run 2)
└─ Background agent: Run test suite (run 3)

Phase 2: REDUCE
└─ General-purpose agent: Compare results, identify inconsistencies
```

---

## Coverage Analysis

### Pattern: Gap Identification

```
User Request: "Improve test coverage"

Phase 1: BACKGROUND
└─ Background agent: Run coverage report

Phase 2: EXPLORE
└─ Explore agent: Identify critical uncovered paths

Phase 3: FAN-OUT (Prioritized gap filling)
├─ Agent A: Tests for critical uncovered module 1
├─ Agent B: Tests for critical uncovered module 2
└─ Agent C: Tests for error handlers

Phase 4: PIPELINE
└─ General-purpose agent: Re-run coverage, verify improvement
```

### Pattern: Risk-Based Coverage

```
Phase 1: EXPLORE
└─ Explore agent: Identify high-risk code (complexity, change frequency)

Phase 2: FAN-OUT
├─ Agent A: Analyze coverage of high-risk area 1
├─ Agent B: Analyze coverage of high-risk area 2
└─ Agent C: Analyze coverage of high-risk area 3

Phase 3: REDUCE
└─ General-purpose agent: Prioritized test improvement plan
```

---

## Test Maintenance

### Pattern: Broken Test Triage

```
User Request: "Fix failing tests"

Phase 1: BACKGROUND
└─ Background agent: Run tests, capture failures

Phase 2: FAN-OUT (Parallel diagnosis)
├─ Agent A: Diagnose failure group 1
├─ Agent B: Diagnose failure group 2
└─ Agent C: Diagnose failure group 3

Phase 3: FAN-OUT (Parallel fixes)
├─ Agent A: Fix test group 1
├─ Agent B: Fix test group 2
└─ Agent C: Fix test group 3

Phase 4: PIPELINE
└─ Background agent: Verify all tests pass
```

### Pattern: Test Refactoring

```
User Request: "Clean up test duplication"

Phase 1: EXPLORE
└─ Explore agent: Find duplicate test patterns

Phase 2: PLAN
└─ Plan agent: Design shared fixtures, helpers, patterns

Phase 3: FAN-OUT
├─ Agent A: Extract shared fixtures
├─ Agent B: Refactor test file group 1
└─ Agent C: Refactor test file group 2

Phase 4: PIPELINE
└─ Background agent: Verify tests still pass
```

### Pattern: Mock Maintenance

```
Phase 1: EXPLORE
└─ Explore agent: Find outdated mocks (API changes, schema changes)

Phase 2: FAN-OUT
├─ Agent A: Update mock group 1
├─ Agent B: Update mock group 2
└─ Agent C: Update fixtures and factories

Phase 3: PIPELINE
└─ Background agent: Run affected tests
```

---

## E2E Testing

### Pattern: User Journey Testing

```
User Request: "Add E2E tests for user registration"

Phase 1: EXPLORE
└─ Explore agent: Map registration flow, identify test scenarios

Phase 2: PIPELINE (Sequential scenarios)
├─ General-purpose agent: Happy path registration
├─ General-purpose agent: Validation error scenarios
├─ General-purpose agent: Duplicate email handling
└─ General-purpose agent: Email verification flow

Phase 3: BACKGROUND
└─ Background agent: Run E2E suite, capture screenshots
```

### Pattern: Cross-Browser Testing

```
Phase 1: FAN-OUT (Parallel browsers)
├─ Background agent: Run E2E in Chrome
├─ Background agent: Run E2E in Firefox
├─ Background agent: Run E2E in Safari
└─ Background agent: Run E2E in Edge

Phase 2: REDUCE
└─ General-purpose agent: Browser compatibility report
```

### Pattern: Visual Regression

```
Phase 1: BACKGROUND
└─ Background agent: Run visual regression tests

Phase 2: EXPLORE (If failures)
└─ Explore agent: Compare screenshots, identify changes

Phase 3: PIPELINE
└─ General-purpose agent: Categorize as bugs vs intentional changes
```

---

## Task Management for Testing

Structure testing work as tasks with clear dependencies:

```python
# Create testing tasks
TaskCreate(subject="Identify testing scope", description="Analyze what needs testing...")
TaskCreate(subject="Generate unit tests", description="Tests for module A...")
TaskCreate(subject="Generate integration tests", description="Tests for API endpoints...")
TaskCreate(subject="Run test suite", description="Execute all tests, capture results...")
TaskCreate(subject="Fix failures", description="Address any failing tests...")
TaskCreate(subject="Verify all pass", description="Final test run to confirm...")

# Dependencies
TaskUpdate(taskId="2", addBlockedBy=["1"])
TaskUpdate(taskId="3", addBlockedBy=["1"])
TaskUpdate(taskId="4", addBlockedBy=["2", "3"])
TaskUpdate(taskId="5", addBlockedBy=["4"])
TaskUpdate(taskId="6", addBlockedBy=["5"])

# Parallel test generation (sonnet for well-structured work)
Task(subagent_type="general-purpose", prompt="TaskId 2: Generate unit tests...",
     model="sonnet", run_in_background=True)
Task(subagent_type="general-purpose", prompt="TaskId 3: Generate integration tests...",
     model="sonnet", run_in_background=True)
```

## Test Execution Best Practices

1. **Always run in background** for long test suites
2. **Parallelize independent suites** (unit, integration, e2e)
3. **Fail fast** - stop on first failure for quick feedback
4. **Capture artifacts** - screenshots, logs, coverage reports
5. **Report actionable results** - file:line for failures

---

```
─── ◈ Testing ───────────────────────────
```
