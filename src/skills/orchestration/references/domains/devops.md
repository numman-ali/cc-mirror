# DevOps Orchestration Patterns

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   Infrastructure as carefully orchestrated as code.         │
│   Safe deployments. Fast pipelines. Reliable operations.    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

> **Load when**: CI/CD pipeline, deployment, infrastructure as code, monitoring, incident response
> **Common patterns**: Pipeline Setup, Zero-Downtime Deployment, Incident Triage

## Table of Contents

1. [CI/CD Pipeline](#cicd-pipeline)
2. [Deployment](#deployment)
3. [Infrastructure](#infrastructure)
4. [Monitoring and Alerting](#monitoring-and-alerting)
5. [Incident Response](#incident-response)

---

## CI/CD Pipeline

### Pattern: Pipeline Setup

```
User Request: "Set up CI/CD for this project"

Phase 1: EXPLORE
└─ Explore agent: Analyze project structure, build system, test setup

Phase 2: PLAN
└─ Plan agent: Design pipeline stages and requirements

Phase 3: FAN-OUT (Parallel stage implementation)
├─ Agent A: Build stage (compile, dependencies)
├─ Agent B: Test stage (unit, integration)
├─ Agent C: Security scan stage (SAST, dependencies)
└─ Agent D: Deploy stage (environments, rollback)

Phase 4: PIPELINE
└─ General-purpose agent: Wire stages, add notifications
```

### Pattern: Pipeline Optimization

```
User Request: "Speed up our CI pipeline"

Phase 1: FAN-OUT (Parallel analysis)
├─ Explore agent: Analyze current pipeline duration by stage
├─ Explore agent: Find parallelization opportunities
├─ Explore agent: Check caching effectiveness
└─ Explore agent: Review resource allocation

Phase 2: REDUCE
└─ Plan agent: Prioritized optimization plan

Phase 3: FAN-OUT (Implement optimizations)
├─ Agent A: Implement caching improvements
├─ Agent B: Parallelize independent jobs
└─ Agent C: Optimize resource-heavy stages
```

### Pattern: Multi-Environment Pipeline

```
Phase 1: EXPLORE
└─ Explore agent: Map environments (dev, staging, prod)

Phase 2: FAN-OUT
├─ Agent A: Configure dev deployment
├─ Agent B: Configure staging deployment
├─ Agent C: Configure prod deployment (with gates)
└─ Agent D: Configure environment promotions

Phase 3: PIPELINE
└─ General-purpose agent: Add approval workflows, rollback triggers
```

---

## Deployment

### Pattern: Zero-Downtime Deployment

```
User Request: "Deploy the new version without downtime"

Phase 1: EXPLORE
└─ Explore agent: Current deployment strategy, infrastructure

Phase 2: PIPELINE
├─ General-purpose agent: Build and tag new image
├─ General-purpose agent: Deploy to canary/blue environment
├─ Background agent: Run smoke tests
└─ General-purpose agent: Shift traffic, drain old instances

Phase 3: BACKGROUND
└─ Background agent: Monitor error rates post-deploy
```

### Pattern: Rollback Preparation

```
Phase 1: FAN-OUT (Pre-deployment)
├─ Agent A: Tag current stable version
├─ Agent B: Document database state
├─ Agent C: Prepare rollback scripts
└─ Agent D: Verify rollback path

Phase 2: PIPELINE (Deployment with safety)
├─ General-purpose agent: Deploy new version
├─ Background agent: Health check monitoring
└─ General-purpose agent: (If needed) Execute rollback
```

### Pattern: Database Migration Deployment

```
Phase 1: PIPELINE (Safe migration)
├─ General-purpose agent: Backup current database
├─ General-purpose agent: Run forward migration
├─ General-purpose agent: Deploy compatible app version
└─ Background agent: Verify data integrity

Phase 2: BACKGROUND
└─ Background agent: Monitor for migration issues
```

---

## Infrastructure

### Pattern: Infrastructure as Code

```
User Request: "Create Terraform for our AWS setup"

Phase 1: EXPLORE
└─ Explore agent: Map current infrastructure, requirements

Phase 2: FAN-OUT (Parallel module creation)
├─ Agent A: Network module (VPC, subnets, security groups)
├─ Agent B: Compute module (ECS/EKS, EC2)
├─ Agent C: Database module (RDS, ElastiCache)
├─ Agent D: Storage module (S3, EFS)
└─ Agent E: CDN and DNS module

Phase 3: PIPELINE
├─ General-purpose agent: Wire modules, configure state backend
└─ Background agent: Validate and plan
```

### Pattern: Kubernetes Manifest Generation

```
Phase 1: EXPLORE
└─ Explore agent: Analyze application requirements

Phase 2: FAN-OUT
├─ Agent A: Deployment manifests
├─ Agent B: Service and ingress manifests
├─ Agent C: ConfigMaps and Secrets
├─ Agent D: HPA and PDB configurations
└─ Agent E: NetworkPolicies

Phase 3: PIPELINE
├─ General-purpose agent: Kustomize or Helm setup
└─ Background agent: Validate against cluster
```

### Pattern: Security Hardening

```
Phase 1: FAN-OUT (Parallel security checks)
├─ Agent A: Network security (firewall, security groups)
├─ Agent B: IAM and access control
├─ Agent C: Encryption (at rest, in transit)
├─ Agent D: Secrets management
└─ Agent E: Compliance checks

Phase 2: REDUCE
└─ General-purpose agent: Security report with remediations

Phase 3: FAN-OUT (Implement fixes)
├─ Agents implement security improvements
```

---

## Monitoring and Alerting

### Pattern: Observability Setup

```
User Request: "Set up monitoring for the application"

Phase 1: FAN-OUT (Parallel pillar implementation)
├─ Agent A: Metrics (Prometheus, CloudWatch)
├─ Agent B: Logging (ELK, CloudWatch Logs)
├─ Agent C: Tracing (Jaeger, X-Ray)
└─ Agent D: Dashboards (Grafana, custom)

Phase 2: PIPELINE
└─ General-purpose agent: Configure alerting rules, runbooks
```

### Pattern: Alert Tuning

```
Phase 1: EXPLORE
└─ Explore agent: Analyze current alerts, noise ratio

Phase 2: FAN-OUT
├─ Agent A: Tune threshold-based alerts
├─ Agent B: Implement anomaly detection
└─ Agent C: Configure alert routing

Phase 3: PIPELINE
└─ General-purpose agent: Document runbooks for each alert
```

### Pattern: SLO Definition

```
Phase 1: EXPLORE
└─ Explore agent: Identify critical user journeys

Phase 2: FAN-OUT
├─ Agent A: Define availability SLIs/SLOs
├─ Agent B: Define latency SLIs/SLOs
├─ Agent C: Define error rate SLIs/SLOs
└─ Agent D: Configure error budget alerts

Phase 3: PIPELINE
└─ General-purpose agent: Create SLO dashboard
```

---

## Incident Response

### Pattern: Incident Triage

```
User Request: "Production is down!"

Phase 1: FAN-OUT (Rapid parallel diagnosis)
├─ Agent A: Check application logs for errors
├─ Agent B: Check infrastructure metrics
├─ Agent C: Check recent deployments
├─ Agent D: Check external dependencies
└─ Agent E: Check database health

Phase 2: REDUCE (Fast)
└─ General-purpose agent: Identify most likely cause

Phase 3: PIPELINE
├─ General-purpose agent: Implement fix or rollback
└─ Background agent: Verify recovery
```

### Pattern: Post-Incident Review

```
Phase 1: FAN-OUT (Evidence gathering)
├─ Explore agent: Timeline of events
├─ Explore agent: Relevant logs and metrics
├─ Explore agent: Changes before incident
└─ Explore agent: Response actions taken

Phase 2: PIPELINE
├─ General-purpose agent: Root cause analysis
├─ General-purpose agent: Impact assessment
└─ General-purpose agent: Action items and preventions

Phase 3: REDUCE
└─ General-purpose agent: Post-mortem document
```

### Pattern: Runbook Execution

```
Phase 1: EXPLORE
└─ Explore agent: Find relevant runbook

Phase 2: PIPELINE (Step-by-step)
├─ General-purpose agent: Execute step 1
├─ General-purpose agent: Verify step 1
├─ General-purpose agent: Execute step 2
└─ ... continue until resolved

Phase 3: BACKGROUND
└─ Background agent: Continued monitoring
```

---

## Task Management for DevOps

Structure infrastructure work with safety checkpoints:

```python
# Create DevOps tasks
TaskCreate(subject="Assess infrastructure", description="Current state, requirements...")
TaskCreate(subject="Plan changes", description="Design with minimal disruption...")
TaskCreate(subject="Implement network changes", description="VPC, security groups...")
TaskCreate(subject="Implement compute changes", description="ECS, scaling...")
TaskCreate(subject="Validate deployment", description="Health checks, smoke tests...")
TaskCreate(subject="Configure monitoring", description="Alerts, dashboards...")

# Sequential safety gates
TaskUpdate(taskId="2", addBlockedBy=["1"])
TaskUpdate(taskId="3", addBlockedBy=["2"])
TaskUpdate(taskId="4", addBlockedBy=["2"])  # Can parallel with network
TaskUpdate(taskId="5", addBlockedBy=["3", "4"])
TaskUpdate(taskId="6", addBlockedBy=["5"])

# Parallel infrastructure implementation (sonnet for well-structured work)
Task(subagent_type="general-purpose", prompt="TaskId 3: Implement network changes...",
     model="sonnet", run_in_background=True)
Task(subagent_type="general-purpose", prompt="TaskId 4: Implement compute changes...",
     model="sonnet", run_in_background=True)
```

## Safety Principles

1. **Always have rollback plan** before deploying
2. **Background monitor** during and after deployment
3. **Parallel diagnosis** during incidents for speed
4. **Document everything** for future incidents
5. **Test in staging** before production

---

```
─── ◈ DevOps ────────────────────────────
```
