# Orchestration Examples

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   Real-world workflows, end to end.                         │
│   See how patterns come together in practice.               │
│                                                             │
│   Each example shows:                                       │
│   • What the user says                                      │
│   • How you orchestrate (internal)                          │
│   • What the user experiences (external)                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Table of Contents

1. [Review a PR](#review-a-pr)
2. [Implement a Feature](#implement-a-feature)
3. [Fix a Bug](#fix-a-bug)
4. [Understand a Codebase](#understand-a-codebase)
5. [Run Tests and Fix Failures](#run-tests-and-fix-failures)

---

## Review a PR

**User says:** "Review PR #123"

### Internal Analysis

- Multi-dimensional analysis needed (code quality, security, performance)
- Independent dimensions → **Fan-Out**
- Need to aggregate findings → **Map-Reduce**

### Execution

```
# Phase 1: Gather context + parallel analysis (single message)
Task(subagent_type="Explore", description="Get PR context",
     prompt="Fetch PR #123 details, understand what changed and why",
     model="haiku", run_in_background=True)
Task(subagent_type="general-purpose", description="Review quality",
     prompt="Review code quality: readability, patterns, maintainability",
     model="opus", run_in_background=True)  # Critical thinking for review
Task(subagent_type="general-purpose", description="Review security",
     prompt="Review security: injection, auth, data exposure risks",
     model="opus", run_in_background=True)  # Security needs judgment
Task(subagent_type="general-purpose", description="Review performance",
     prompt="Review performance: complexity, queries, memory usage",
     model="opus", run_in_background=True)  # Performance analysis
```

### User Sees

```
Reviewing PR #123 from multiple angles...

---

## Summary
Adds user profile editing with image upload capability.

## Risk Assessment
- Security: Medium (file upload needs validation)
- Performance: Low
- Breaking Changes: No

## Must Fix
1. Missing file type validation in upload handler (line 47)
   - Could allow malicious file uploads

## Should Fix
1. Add rate limiting to profile update endpoint
2. Consider compressing uploaded images

## Looks Good
- Clean component structure
- Good error handling in UI
- Tests cover happy path
```

---

## Implement a Feature

**User says:** "Add dark mode to the app"

### Internal Analysis

- Need to understand existing styling → Research first
- Multiple independent components → **Fan-Out** for implementation
- Must integrate at end → **Pipeline** finish

### Execution

```
# Phase 1: Research (haiku for exploration)
context = Task(subagent_type="Explore", description="Find styling patterns",
               prompt="Find existing theme/styling patterns, CSS architecture",
               model="haiku", run_in_background=True)

# Phase 2: Plan (opus for design decisions)
plan = Task(subagent_type="Plan", description="Design dark mode",
            prompt=f"Given: {context}. Design dark mode implementation.",
            model="opus", run_in_background=True)

# Phase 3: Implement (sonnet for well-structured work - single message)
Task(subagent_type="general-purpose", description="Add CSS variables",
     prompt="Add dark theme CSS variables...",
     model="sonnet", run_in_background=True)
Task(subagent_type="general-purpose", description="Create toggle",
     prompt="Create theme toggle component...",
     model="sonnet", run_in_background=True)
Task(subagent_type="general-purpose", description="Add persistence",
     prompt="Add localStorage persistence for theme preference...",
     model="sonnet", run_in_background=True)

# Phase 4: Integration (sonnet for implementation)
Task(subagent_type="general-purpose", description="Wire and test",
     prompt="Wire components together, test theme switching works",
     model="sonnet", run_in_background=True)
```

### User Sees

```
Adding dark mode to your app.

Exploring your codebase to understand styling patterns...

Found: Tailwind with CSS variables in globals.css, no existing theme system.

Plan:
1. Add CSS variables for dark theme colors
2. Create theme toggle component
3. Persist preference in localStorage
4. Wire up and test

Starting implementation...

---

Progress:
- Added dark theme variables to globals.css
- Created ThemeToggle component at components/theme-toggle.tsx

Working on persistence...

---

Done! Dark mode is ready:
- Toggle in header (components/theme-toggle.tsx)
- Preference saved to localStorage
- System preference detected on first visit

Try it: Click the moon/sun icon in the header.
```

---

## Fix a Bug

**User says:** "Users can't log in after password reset"

### Internal Analysis

- Unknown cause → Need parallel investigation
- Multiple hypotheses → **Fan-Out** for diagnosis
- May need **Speculative** if cause unclear

### Execution

```
# Phase 1: Parallel diagnosis (haiku swarm - single message)
Task(subagent_type="Explore", description="Check logs",
     prompt="Search for login errors, password reset issues in logs",
     model="haiku", run_in_background=True)
Task(subagent_type="Explore", description="Find reset flow",
     prompt="Find password reset implementation, trace the flow",
     model="haiku", run_in_background=True)
Task(subagent_type="Explore", description="Check session handling",
     prompt="How are sessions/tokens handled after password change?",
     model="haiku", run_in_background=True)

# Phase 2: Synthesize (after results return)
# Identify: Password reset invalidates session but doesn't clear cookie

# Phase 3: Fix (sonnet for implementation)
Task(subagent_type="general-purpose", description="Fix session bug",
     prompt="Clear session cookie after password reset...",
     model="sonnet", run_in_background=True)

# Phase 4: Verify (sonnet for test writing)
Task(subagent_type="general-purpose", description="Add regression test",
     prompt="Add test for login after password reset...",
     model="sonnet", run_in_background=True)
```

### User Sees

```
Investigating the login issue after password reset...

Checking a few things:
- Error logs
- Password reset flow
- Session handling

---

Found the issue: Password reset invalidates the session token in the database,
but the old session cookie remains in the browser. On next login attempt,
the invalid cookie causes auth to fail.

Fix: Clear the session cookie when password is reset.

Implementing fix...

---

Fixed in auth/password-reset.ts (line 89).
Added regression test in __tests__/auth.test.ts.

The flow now:
1. User resets password
2. Session cookie is cleared
3. User redirected to login
4. Fresh login works correctly
```

---

## Understand a Codebase

**User says:** "Help me understand this codebase"

### Internal Analysis

- Breadth-first exploration needed
- Multiple independent areas → **Fan-Out**
- Aggregate into overview → **Map-Reduce**

### Execution

```
# Phase 1: Parallel exploration (haiku swarm - single message)
Task(subagent_type="Explore", description="Project structure",
     prompt="Analyze project structure, entry points, build system",
     model="haiku", run_in_background=True)
Task(subagent_type="Explore", description="Core patterns",
     prompt="Identify core architectural patterns, frameworks used",
     model="haiku", run_in_background=True)
Task(subagent_type="Explore", description="Data flow",
     prompt="Trace main data flows, API structure, state management",
     model="haiku", run_in_background=True)
```

### User Sees

```
Exploring the codebase...

---

## Overview
Next.js 14 app with TypeScript, using App Router.

## Structure
```

src/
├── app/ # Routes and pages
├── components/ # React components (shadcn/ui)
├── lib/ # Utilities and helpers
├── services/ # API clients and business logic
└── types/ # TypeScript types

````

## Key Patterns
- **Data fetching**: Server components with async/await
- **State**: React Context for auth, Zustand for UI state
- **Styling**: Tailwind CSS with shadcn/ui components
- **API**: REST endpoints in app/api/, Prisma for database

## Entry Points
- `app/page.tsx` - Home page
- `app/api/` - API routes
- `middleware.ts` - Auth middleware

## Getting Started
```bash
npm install
npm run dev
````

Want me to dive deeper into any area?

````

---

## Run Tests and Fix Failures

**User says:** "Run tests and fix any failures"

### Internal Analysis
- Long-running task → **Background** for tests
- Multiple failures → **Fan-Out** for fixes

### Execution

```
# Phase 1: Run tests in background (sonnet for test execution)
Task(subagent_type="general-purpose", description="Run tests",
     prompt="Run full test suite, report failures",
     model="sonnet", run_in_background=True)

# Continue with other work or wait
result = TaskOutput(task_id="...", block=True)

# Phase 2: Fix failures (sonnet for fixes - single message)
# If 3 failures found:
Task(subagent_type="general-purpose", description="Fix test 1",
     prompt="Fix failing test in auth.test.ts...",
     model="sonnet", run_in_background=True)
Task(subagent_type="general-purpose", description="Fix test 2",
     prompt="Fix failing test in api.test.ts...",
     model="sonnet", run_in_background=True)
Task(subagent_type="general-purpose", description="Fix test 3",
     prompt="Fix failing test in utils.test.ts...",
     model="sonnet", run_in_background=True)

# Phase 3: Verify (sonnet for test execution)
Task(subagent_type="general-purpose", description="Re-run tests",
     prompt="Run test suite again to verify fixes",
     model="sonnet", run_in_background=True)
````

### User Sees

```
Running test suite...

---

Test Results: 47 passed, 3 failed

Failures:
1. auth.test.ts - "should reject expired tokens"
2. api.test.ts - "should handle rate limiting"
3. utils.test.ts - "should format dates correctly"

Fixing these now...

---

Fixed all 3 failures:
1. auth.test.ts - Updated mock token expiry time
2. api.test.ts - Added missing rate limit header in test
3. utils.test.ts - Fixed timezone handling in date formatter

Re-running tests...

---

All 50 tests passing.
```

---

## Key Patterns Summary

| Scenario    | Pattern                       | Why                                 |
| ----------- | ----------------------------- | ----------------------------------- |
| PR Review   | Fan-Out → Reduce              | Parallel analysis, unified output   |
| Feature     | Pipeline → Fan-Out → Pipeline | Research, parallel build, integrate |
| Bug Fix     | Fan-Out → Pipeline            | Parallel diagnosis, sequential fix  |
| Exploration | Fan-Out → Reduce              | Parallel discovery, synthesize      |
| Tests       | Background → Fan-Out          | Long-running, parallel fixes        |

---

```
┌────────────────────────────────────────┐
│  Remember:                             │
│                                        │
│  • Users see natural conversation      │
│  • Pattern names stay internal         │
│  • Results feel like magic             │
│                                        │
└────────────────────────────────────────┘
```

```
─── ◈ Examples Complete ─────────────────
```
