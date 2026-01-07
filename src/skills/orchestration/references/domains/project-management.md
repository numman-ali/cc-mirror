# Project Management Orchestration Patterns

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   Complex projects, clearly decomposed.                     │
│   Dependencies tracked. Progress visible. Team aligned.     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

> **Load when**: Epic breakdown, sprint planning, progress tracking, dependency management, team coordination
> **Common patterns**: Hierarchical Decomposition, Capacity-Based Planning, Multi-Dimension Status

## Table of Contents

1. [Epic Breakdown](#epic-breakdown)
2. [Sprint Planning](#sprint-planning)
3. [Progress Tracking](#progress-tracking)
4. [Dependency Management](#dependency-management)
5. [Team Coordination](#team-coordination)

---

## Epic Breakdown

### Pattern: Hierarchical Decomposition

```
User Request: "Break down the authentication epic"

Phase 1: EXPLORE
└─ Explore agent: Understand requirements, existing system

Phase 2: PLAN
└─ Plan agent: Design high-level feature breakdown

Phase 3: FAN-OUT (Parallel story creation)
├─ Agent A: User stories for login/logout
├─ Agent B: User stories for registration
├─ Agent C: User stories for password management
├─ Agent D: User stories for session management
└─ Agent E: User stories for OAuth integration

Phase 4: REDUCE
└─ General-purpose agent: Organize into coherent backlog
```

**Task Management Implementation:**

```
# Create epic
TaskCreate(subject="Epic: User Authentication", description="Complete auth system")

# Create stories
TaskCreate(subject="Story: Login flow", description="...")
TaskCreate(subject="Story: Registration", description="...")
TaskCreate(subject="Story: Password reset", description="...")

# Set dependencies
TaskUpdate(taskId="3", addBlockedBy=["2"])  # Reset after registration
```

### Pattern: Vertical Slice Breakdown

```
Phase 1: EXPLORE
└─ Explore agent: Map feature touchpoints (UI, API, DB)

Phase 2: FAN-OUT (Slice by user value)
├─ Agent A: Define slice 1 (minimal viable feature)
├─ Agent B: Define slice 2 (enhanced feature)
└─ Agent C: Define slice 3 (complete feature)

Phase 3: PIPELINE
└─ General-purpose agent: Estimate, prioritize, sequence
```

### Pattern: Spike-First Breakdown

```
Phase 1: EXPLORE
└─ Explore agent: Identify unknowns and risks

Phase 2: FAN-OUT (Parallel spikes)
├─ Agent A: Technical spike - feasibility
├─ Agent B: Technical spike - performance
└─ Agent C: UX spike - user research

Phase 3: REDUCE
└─ General-purpose agent: Use spike findings to refine breakdown
```

---

## Sprint Planning

### Pattern: Capacity-Based Planning

```
User Request: "Plan the next sprint"

Phase 1: FAN-OUT (Gather context)
├─ Explore agent: Review backlog priority
├─ Explore agent: Check team capacity
├─ Explore agent: Review blockers and dependencies
└─ Explore agent: Check carryover from last sprint

Phase 2: REDUCE
└─ Plan agent: Propose sprint scope

Phase 3: FAN-OUT (Task breakdown)
├─ Agent A: Break down story 1 into tasks
├─ Agent B: Break down story 2 into tasks
└─ Agent C: Break down story 3 into tasks

Phase 4: PIPELINE
└─ General-purpose agent: Finalize sprint backlog
```

**Task Structure:**

```
# Sprint-level task
TaskCreate(subject="Sprint 14: Auth Implementation", description="...")

# Stories within sprint
TaskCreate(subject="Login API endpoint", description="...")
TaskCreate(subject="Login UI component", description="...")
TaskUpdate(taskId="2", addBlockedBy=["1"])  # UI needs API first

# Sub-tasks
TaskCreate(subject="Write login validation", description="...")
TaskCreate(subject="Add rate limiting", description="...")
```

### Pattern: Risk-Adjusted Planning

```
Phase 1: FAN-OUT
├─ Agent A: Identify technical risks
├─ Agent B: Identify dependency risks
└─ Agent C: Identify scope risks

Phase 2: REDUCE
└─ Plan agent: Adjust estimates with risk buffer

Phase 3: PIPELINE
└─ General-purpose agent: Create contingency tasks
```

---

## Progress Tracking

### Pattern: Multi-Dimension Status

```
User Request: "What's the project status?"

Phase 1: FAN-OUT (Parallel status gathering)
├─ Agent A: Task completion status (from TaskList)
├─ Agent B: Blocker analysis
├─ Agent C: Timeline vs plan
├─ Agent D: Quality metrics
└─ Agent E: Risk status

Phase 2: REDUCE
└─ General-purpose agent: Executive status summary
```

**Using TaskList:**

```
# Get current state
TaskList()  # Returns all tasks with status

# Update progress
TaskUpdate(taskId="5", addComment={
  author: "agent-id",
  content: "50% complete, blocked on API review"
})

# Mark complete
TaskUpdate(taskId="5", status="resolved")
```

### Pattern: Burndown Tracking

```
Phase 1: EXPLORE
└─ Explore agent: Calculate completed vs remaining work

Phase 2: PIPELINE
├─ General-purpose agent: Project completion trajectory
├─ General-purpose agent: Identify velocity trends
└─ General-purpose agent: Flag at-risk items

Phase 3: REDUCE
└─ General-purpose agent: Burndown report
```

### Pattern: Blocker Resolution

```
Phase 1: EXPLORE
└─ Explore agent: Identify all blocked tasks

Phase 2: FAN-OUT (Parallel resolution paths)
├─ Agent A: Investigate blocker 1
├─ Agent B: Investigate blocker 2
└─ Agent C: Investigate blocker 3

Phase 3: REDUCE
└─ General-purpose agent: Resolution plan, escalation needs
```

---

## Dependency Management

### Pattern: Dependency Graph Construction

```
User Request: "Map project dependencies"

Phase 1: EXPLORE
└─ Explore agent: List all tasks and their relationships

Phase 2: FAN-OUT
├─ Agent A: Map technical dependencies
├─ Agent B: Map team/resource dependencies
└─ Agent C: Map external dependencies

Phase 3: REDUCE
└─ General-purpose agent: Dependency graph, critical path
```

**Implementation:**

```
# Create dependency chain
TaskCreate(subject="Database schema", description="...")
TaskCreate(subject="API models", description="...")
TaskCreate(subject="API endpoints", description="...")
TaskCreate(subject="Frontend integration", description="...")

TaskUpdate(taskId="2", addBlockedBy=["1"])
TaskUpdate(taskId="3", addBlockedBy=["2"])
TaskUpdate(taskId="4", addBlockedBy=["3"])

# Cross-team dependency
TaskCreate(subject="External API access", description="Waiting on partner")
TaskUpdate(taskId="3", addBlockedBy=["5"])  # Blocked by external
```

### Pattern: Critical Path Analysis

```
Phase 1: EXPLORE
└─ Explore agent: Map all task dependencies

Phase 2: PIPELINE
├─ General-purpose agent: Calculate path lengths
├─ General-purpose agent: Identify critical path
└─ General-purpose agent: Find parallel opportunities

Phase 3: REDUCE
└─ General-purpose agent: Optimization recommendations
```

### Pattern: Dependency Resolution

```
Phase 1: FAN-OUT
├─ Agent A: Identify circular dependencies
├─ Agent B: Identify unnecessary dependencies
└─ Agent C: Identify dependency bottlenecks

Phase 2: PIPELINE
└─ General-purpose agent: Restructure to unblock work
```

---

## Team Coordination

### Pattern: Work Distribution

```
User Request: "Assign work for this sprint"

Phase 1: FAN-OUT
├─ Explore agent: Analyze task requirements
├─ Explore agent: Review team skills/capacity
└─ Explore agent: Check current assignments

Phase 2: REDUCE
└─ Plan agent: Optimal assignment recommendations

Phase 3: FAN-OUT (Parallel task assignment)
├─ Agent A: Create task assignments for dev 1
├─ Agent B: Create task assignments for dev 2
└─ Agent C: Create task assignments for dev 3
```

### Pattern: Handoff Coordination

```
Phase 1: EXPLORE
└─ Explore agent: Identify tasks requiring handoffs

Phase 2: PIPELINE
├─ General-purpose agent: Document handoff requirements
├─ General-purpose agent: Create handoff checklist
└─ General-purpose agent: Schedule coordination points
```

### Pattern: Multi-Team Sync

```
Phase 1: FAN-OUT
├─ Agent A: Gather Team A status
├─ Agent B: Gather Team B status
└─ Agent C: Identify cross-team dependencies

Phase 2: REDUCE
└─ General-purpose agent: Cross-team status, blockers, needs
```

---

## Task Management in Practice

All project management work should use TaskCreate for proper tracking:

```python
# Sprint planning example
TaskCreate(subject="Sprint 14 Planning", description="Plan next sprint scope...")
TaskCreate(subject="Review backlog", description="Prioritize stories...")
TaskCreate(subject="Break down Story A", description="Create implementation tasks...")
TaskCreate(subject="Break down Story B", description="Create implementation tasks...")
TaskCreate(subject="Set dependencies", description="Wire task dependencies...")
TaskCreate(subject="Assign work", description="Distribute to team...")

# Planning sequence
TaskUpdate(taskId="2", addBlockedBy=["1"])
TaskUpdate(taskId="3", addBlockedBy=["2"])
TaskUpdate(taskId="4", addBlockedBy=["2"])
TaskUpdate(taskId="5", addBlockedBy=["3", "4"])
TaskUpdate(taskId="6", addBlockedBy=["5"])

# Parallel breakdown (sonnet for structured planning work)
Task(subagent_type="general-purpose", prompt="TaskId 3: Break down Story A...",
     model="sonnet", run_in_background=True)
Task(subagent_type="general-purpose", prompt="TaskId 4: Break down Story B...",
     model="sonnet", run_in_background=True)
```

## Best Practices

1. **Break down early** - Large tasks are hard to track
2. **Set dependencies explicitly** - Prevents blocked work
3. **Update status frequently** - Real-time visibility
4. **Comment on blockers** - Context for resolution
5. **Close completed tasks immediately** - Accurate progress

---

```
─── ◈ Project Management ────────────────
```
