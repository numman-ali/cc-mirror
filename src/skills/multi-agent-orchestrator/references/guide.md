# Getting the Most from Orchestrated Work

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   Welcome to a different way of working.                    │
│                                                             │
│   You describe what you want.                               │
│   Complex work happens elegantly behind the scenes.         │
│   Results arrive — clear, complete, satisfying.             │
│                                                             │
│   That's the promise.                                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## What Happens Behind the Scenes

When you ask for something complex — "review this PR" or "build a new feature" — something special happens:

```
Your Request
     │
     ▼
┌─────────────────────┐
│  Understanding      │  ← What do you really need?
└─────────────────────┘
     │
     ▼
┌─────────────────────┐
│  Clarification      │  ← Smart questions if needed
└─────────────────────┘
     │
     ▼
┌─────────────────────┐
│  Parallel Work      │  ← Multiple angles, simultaneously
└─────────────────────┘
     │
     ▼
┌─────────────────────┐
│  Synthesis          │  ← Everything comes together
└─────────────────────┘
     │
     ▼
  Results
```

**You don't need to understand any of this.** Just describe what you want. But knowing it happens might help you phrase requests effectively.

---

## What You'll Experience

### Quick Tasks (< 30 seconds)

Just the result — clean and direct:

```
You: "Find where user authentication is handled"

Claude: "Authentication is handled in these files:

  • src/auth/handler.ts — Main login/logout logic
  • src/middleware/auth.ts — Route protection
  • src/services/session.ts — Session management

Want me to dive deeper into any of these?"
```

### Standard Tasks (30 seconds - 5 minutes)

Natural progress, then results:

```
You: "Review PR #123"

Claude: "Looking at this PR from several angles..."

─── ◈ Orchestrating ── PR Review ──

[A few moments pass]

┌────────────────────────────────────────┐
│  ✓ Review Complete                     │
└────────────────────────────────────────┘

## PR Review: Add User Profile Feature

### Summary
Adds user profile editing with avatar upload.

### Risk Assessment
• Security: Medium (file upload needs validation)
• Performance: Low
• Breaking Changes: No

### Must Fix
1. Missing file type validation in upload handler (line 47)

### Looks Good
• Clean component structure
• Good error handling
• Tests cover happy path

─── ◈ Complete ──────────────────────────
```

### Large Projects (5+ minutes)

Structured phases with clear milestones:

```
You: "Migrate the database from MongoDB to PostgreSQL"

Claude: "This is a significant migration. Let me understand your setup first."

[Asks smart questions via multiple-choice UI]

Claude: "Got it. Here's how I'll approach this:

┌────────────────────────────────────────┐
│  Migration Plan                        │
│                                        │
│  Phase 1: Schema Analysis              │
│  Phase 2: Code Updates                 │
│  Phase 3: Data Migration               │
│  Phase 4: Verification                 │
└────────────────────────────────────────┘

Starting Phase 1..."

─── ◈ Orchestrating ── Phase 1: Schema Analysis ──

[Work proceeds]

┌────────────────────────────────────────┐
│  ✓ Phase 1 Complete                    │
│                                        │
│  • 12 collections mapped               │
│  • 8 relationships identified          │
│  • 3 transformations needed            │
│                                        │
│  Moving to Phase 2: Code Updates       │
└────────────────────────────────────────┘
```

---

## Tips for Best Results

### Be Specific About Scope

The clearer you are, the better the results.

| Instead of...     | Try...                                                |
| ----------------- | ----------------------------------------------------- |
| "Review the code" | "Review PR #123 focusing on security"                 |
| "Fix the bug"     | "Fix the login bug that happens after password reset" |
| "Make it faster"  | "Optimize the database queries in the user service"   |
| "Add a feature"   | "Add dark mode with a toggle in the header"           |

### Provide Context When Helpful

A little context goes a long way:

```
Good: "Add authentication — we're using Next.js with Prisma"
Good: "Refactor to async/await — this is a Node.js backend"
Good: "Review for security — this handles payment data"
```

### Trust the Process

- If clarification is needed, you'll be asked — with easy multiple-choice options
- If you're not asked, the request was clear enough
- Progress updates appear for longer tasks
- Results are synthesized from thorough analysis

---

## Example Interactions

### Feature Implementation

```
You: "Add a dark mode toggle to the app"

Claude: "Adding dark mode. Quick question:"

[Multiple-choice question appears about theme approach]

Claude: "Perfect. Here's the plan:

1. Add theme CSS variables
2. Create toggle component
3. Persist preference

Working on it..."

─── ◈ Orchestrating ── Dark Mode ──

[Work proceeds]

┌────────────────────────────────────────┐
│  ✓ Dark Mode Ready                     │
│                                        │
│  • Toggle in header (components/       │
│    theme-toggle.tsx)                   │
│  • Preference saved to localStorage    │
│  • Respects system preference          │
│                                        │
└────────────────────────────────────────┘

Try clicking the moon/sun icon in the header.

─── ◈ Complete ──────────────────────────
```

### Bug Investigation

```
You: "Users are getting logged out randomly"

Claude: "Investigating. Checking several possible causes..."

─── ◈ Orchestrating ── Bug Investigation ──

[Work proceeds]

Claude: "Found it.

**Root Cause:** Session cookie has `SameSite=Strict` but your app
makes cross-origin API calls from a subdomain.

When users navigate from app.example.com to api.example.com,
the cookie isn't sent, causing auth to fail.

**Fix:** Change to `SameSite=Lax` in session config.

Want me to implement this fix?"

─── ◈ Complete ──────────────────────────
```

### Code Review

```
You: "Review the changes in the auth module"

Claude: "Reviewing the auth module changes from multiple angles..."

─── ◈ Orchestrating ── Auth Review ──

[Work proceeds]

## Auth Module Review

### Files Changed
• auth/login.ts
• auth/session.ts
• auth/middleware.ts

### Findings

**auth/login.ts**
✓ Good error handling
⚠️ Consider rate limiting (line 45)

**auth/session.ts**
✓ Secure token generation
✓ Proper expiry handling

**auth/middleware.ts**
🔴 Missing CSRF protection for state-changing routes

### Recommendation
Add CSRF middleware before merging. Rate limiting is
nice-to-have but not blocking.

─── ◈ Complete ──────────────────────────
```

---

## Frequently Asked Questions

### "Can I see more detail about what's happening?"

Yes! Just ask: "Show me more detail" or "Walk me through your process." Verbosity can be increased on request.

### "What if I want to do things step-by-step instead?"

Just say so: "Let's do this step by step" or "Check with me before each part." The approach will adapt.

### "Can I interrupt a long-running task?"

Yes. Just send a new message. Work can be stopped, pivoted, or continued based on what you need.

### "Why did I get asked a question instead of it just happening?"

Questions appear when:

- The request could be interpreted multiple ways
- There are meaningful choices that affect the outcome
- The action is destructive or hard to reverse
- Your preferences matter for the result

The questions are designed to be quick — multiple choice with clear options.

---

## Getting Help

If results aren't matching expectations:

1. **Be more specific** — Add context about your codebase, goals, or constraints
2. **Break it down** — Large vague requests can be split into focused ones
3. **Provide examples** — "Like how X works in Y file"
4. **Ask for explanation** — "Why did you do it that way?"

Feedback within the conversation is always welcome. The approach adapts.

---

```
─── ◈ Guide Complete ────────────────────
```
