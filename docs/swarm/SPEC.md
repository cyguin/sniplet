# Cyguin Swarm - Autonomous Coding Agent System

**Version**: 1.0  
**Status**: Active  
**Purpose**: Build npm packages under @cyguin scope using autonomous multi-agent pipeline

---

## Overview

The Cyguin Swarm is an autonomous coding agent system that takes a product idea and iteratively builds it through research, development, QA, and signoff phases. Each agent has a specific role, capabilities, and communication protocol.

**Scope**: Build @cyguin npm packages (e.g., @cyguin/flag, @cyguin/feedback)  
**Target**: Next.js App Router compatible drop-in packages  
**Flow**: Sequential with parallel dev/QA phases and human gates

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        USER INPUT: Package Idea                             │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  /s-mgr (intake)                                                             │
│  - Asks structured questions                                                │
│  - Writes to /docs/swarm/[project]/SPEC_DRAFT.md                           │
│  - Completion: "spec-draft-ready"                                           │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  HUMAN GATE #1: Review SPEC_DRAFT.md → Approve / Reject / Revise           │
│  - If reject: loop to /s-mgr with feedback                                 │
│  - If revise: /s-mgr updates                                               │
│  - If approve: promoted to SPEC.md + work begins                           │
└─────────────────────────────────────────────────────────────────────────────┘
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  /s-prj (project manager)                                                   │
│  - Creates /docs/swarm/[project]/SPEC.md                                   │
│  - Creates /docs/swarm/[project]/STATUS.md                                  │
│  - Creates /docs/swarm/[project]/CONTEXT.md                                │
│  - Creates /docs/swarm/[project]/DEV_LOG.md                                │
│  - Creates /docs/swarm/[project]/.env (secrets)                            │
│  - Orchestrates via LOOP_REQUEST messages                                   │
│  - Escalates if agent stuck 10min                                           │
│  - Pauses if STATUS.md set to "paused"                                      │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  INSPECTION: You can view STATUS.md anytime                                 │
│  - /s-prj updates on each agent completion                                  │
│  - Checkpoint commits to git every 3 features                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  RESEARCH (parallel or sequential)                                          │
│  /s-ref → /docs/swarm/[project]/research/references.md                     │
│  /s-res → /docs/swarm/[project]/research/tech-details.md                   │
│  - Both write to CONTEXT.md (summary max 500 tokens each)                  │
│  - Escalation: can't find relevant refs in 5min → asks you                 │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  DEV PHASE (parallel with conflict resolution)                              │
│  /s-dev1 + /s-dev2 work concurrently                                        │
│  - Use DEV_LOG.md to coordinate (file locks)                               │
│  - Checkpoint every 3 features (git commit)                                │
│  - If needs research: LOOP_REQUEST to /s-prj → /s-res                      │
│  - Timeout: agent inactive 15min → /s-prj reassigns                        │
│  - Hard blocker: ESCALATE via /s-prj                                       │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  DEV COMPLETE                                                               │
│  - Both devs send "dev-complete" + hash of work                            │
│  - /s-prj verifies: all features done                                       │
│  - If not: partial-accept prompt                                           │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  QA PHASE (parallel)                                                        │
│  /s-qa1 + /s-qa2 smoke test                                                 │
│  - Run: npm install, npm run build                                          │
│  - Check: exit code 0, types pass, exports resolve                         │
│  - Browser smoke test via opencode-smoke-qa skill (if available)           │
│    - Starts dev server, crawls routes, tests forms/buttons                 │
│    - Falls back to curl-based checks if skill unavailable                 │
│  - Writes /[project]/qa/REPORT.md                                          │
│  - BUGS FOUND: loops to dev (max 3 attempts)                               │
│  - After 3 failures: ESCALATE to you                                       │
└─────────────────────────────────────────────────────────────────────────────┘
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  /s-signoff                                                                 │
│  - Read SPEC.md, compare against implementation                            │
│  - Check: all features done? All tests pass?                               │
│  - If PASS: "project-complete" notification                                │
│  - If FAIL: loop back to dev                                               │
│  - PARTIAL ACCEPT: 3 retries fail → "accept partial?"                      │
└─────────────────────────────────────────────────────────────────────────────┘
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  COMPLETION                                                                 │
│  NOTIFICATION: /s-prj sends: "Project [name] complete!"                   │
│  DELIVERABLES:                                                              │
│    - /packages/[project-name]/ (code)                                      │
│    - /docs/swarm/[project-name]/SPEC.md + summary                          │
│  - REJECT: "Not happy" → loops to /s-mgr                                   │
│  - ACCEPT: done                                                            │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## File Structure

```
/Users/joepro/cyguin/23/
├── docs/swarm/
│   ├── SPEC.md                          # This file
│   ├── USAGE.md                         # Usage guide
│   └── prompts/                         # Agent prompts
│       ├── s-mgr.md
│       ├── s-prj.md
│       ├── s-ref.md
│       ├── s-res.md
│       ├── s-dev.md
│       ├── s-qa.md
│       └── s-signoff.md
├── packages/                            # @cyguin packages
│   └── [project-name]/
│       ├── src/
│       ├── package.json
│       └── tsconfig.json
└── docs/swarm/[project]/                # Per-project docs
    ├── SPEC.md                          # Approved spec
    ├── SPEC_DRAFT.md                    # Pre-approval draft
    ├── STATUS.md                        # Live progress
    ├── CONTEXT.md                       # Shared memory
    ├── DEV_LOG.md                       # Dev coordination
    ├── .env                             # Secrets (600 perms)
    ├── research/
    │   ├── references.md
    │   └── tech-details.md
    └── qa/
        ├── REPORT.md
        └── BUGS.md
```

---

## Loop Trigger Protocol

Agents communicate via structured LOOP_REQUEST messages stored in the project's context.

### Format

```
Trigger: [agent-name]
Reason: [brief why]
Context needed: [what question needs answering]
Priority: high/medium
---
Relevant Context:
[paste relevant CONTEXT.md or SPEC.md excerpts]
```

### Examples

**Developer needs research:**
```
Trigger: /s-res
Reason: Need to understand rate limiting for this API
Context needed: What's the rate limit for OpenAI API? Any workarounds?
Priority: medium
```

**QA finds bugs:**
```
Trigger: /s-dev
Reason: Smoke test failed - build errors
Context needed: See qa/REPORT.md for errors
Priority: high
```

---

## Tool Access Matrix

| Agent | Read | Write | Web Fetch | Bash | Git | Secrets |
|-------|------|-------|-----------|------|-----|---------|
| /s-mgr | ✓ | SPEC_DRAFT | ✗ | ✗ | ✗ | ✗ |
| /s-prj | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ (manages) |
| /s-ref | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| /s-res | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| /s-dev | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ (reads .env) |
| /s-qa | ✓ | ✓ | ✗ | ✓ | ✗ | ✗ |
| /s-signoff | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |

---

## Quality Gates

| Phase | Gate | Criteria | Escalation |
|-------|------|----------|------------|
| Spec | #1 | You approve SPEC_DRAFT.md | N/A |
| Research | internal | Both /s-ref + /s-res report "complete" | Ask you |
| Dev | internal | All feature-checkpoints pass | Reassign task |
| Build | npm run build | Exit code 0, no errors | Loop to dev |
| QA | smoke test | App builds + types pass + browser smoke | Loop to dev (max 3x) |
| Signoff | #2 | Matches SPEC.md features | Partial accept? |
| Completion | #3 | You accept final output | Reject → restart |

---

## Secrets Handling

1. `/docs/swarm/[project]/.env` - Actual secrets (file permissions 600)
2. `/docs/swarm/[project]/ENV.md` - References which keys are needed (not values)
3. Only `/s-prj` can write secrets
4. `/s-dev` can read `.env` but not modify it

---

## Error Handling

| Scenario | Response |
|----------|----------|
| Agent times out (10min inactive) | /s-prj retries once, then escalates |
| Research insufficient | Loop back to /s-res |
| QA finds bugs | Loop to dev (max 3x) |
| Build fails | Dev agents auto-retry with error log |
| 3 retries exhausted | Partial accept prompt to you |
| Hard blocker | /s-prj escalates with context |
| Session/GUI crash | /s-prj records "Session interrupted" in STATUS.md, resumes on next invocation |

---

## Pause / Resume

To pause a project:
```bash
# Edit STATUS.md and change status to "paused"
```

To resume:
```bash
# Edit STATUS.md and change status to "active"
# /s-prj will pick up from last checkpoint
```

---

## Naming Conventions

To avoid export conflicts (e.g., `Flag` type vs `Flag` component):
- **Types/interfaces**: Noun with optional suffix (`FlagData`, `UserConfig`, `TokenResult`)
- **React components**: PascalCase (`Flag`, `Button`, `Modal`)
- **Functions/hooks**: camelCase (`isEnabled`, `useFlag`, `getUser`)
- **DB adapters**: descriptive (`flagsSqlite`, `flagsPg`)

Avoid exporting types and components with identical names.

---

## Git Commit Protocol

### When to Commit

Agents **must** commit at these points:

| Event | Commit Type | Message Pattern |
|-------|-------------|----------------|
| Phase handoff (e.g., research → dev) | `feat:` | `[project] phase: research complete` |
| Feature complete | `feat:` | `[project] add: feature name` |
| Bug fix during development | `fix:` | `[project] fix: issue description` |
| Build error fix | `fix:` | `[project] fix: build error in file/component` |
| QA loop fix | `fix:` | `[project] fix: qa issue in area` |
| Checkpoint (every 3 features) | `feat:` | `[project] checkpoint: group of features` |
| Signoff complete | `chore:` | `[project] signoff: complete` |
| Docs update | `docs:` | `[project] docs: what was documented` |

### Commit Message Format

```
[type]: [project] description

[type] = feat | fix | docs | chore | refactor | test
```

### Examples

```bash
# Feature complete
git commit -m "feat: flag add percentage rollout evaluation"

# Bug fix during dev
git commit -m "fix: flag resolve Flag type/component naming conflict"

# QA loop fix
git commit -m "fix: crisptrader resolve lazy DB init at build time"

# Handoff
git commit -m "feat: crisptrader phase: research complete, moving to dev"

# Signoff
git commit -m "chore: crisptrader signoff: complete, all acceptance criteria met"
```

### Branch Strategy

```
main (production-ready)
  └── staging (integration testing)
        └── feature/[name] (individual features)
```

- Feature branches → PR to staging
- Staging merges → main for production
- Never push directly to main
- Checkpoint commits on staging are encouraged

### Agent Git Access

| Agent | Git Read | Git Write | Notes |
|-------|-----------|------------|-------|
| /s-mgr | ✓ | ✗ | Only writes to docs |
| /s-prj | ✓ | ✓ | Full access, manages branches |
| /s-dev | ✓ | ✓ | Commits feature work |
| /s-qa | ✓ | ✗ | Reads only |
| /s-ref | ✓ | ✗ | Reads only |
| /s-res | ✓ | ✗ | Reads only |
| /s-signoff | ✓ | ✓ | Signs off and commits |

---

## v1 Known Limitations

- Notifications via CLI only (no Slack/email)
- Agents start fresh each project (no cross-project memory)
- Deployment ends at "ready to deploy" - manual deploy required
- No cost tracking per build

---

## Usage

See `/docs/swarm/USAGE.md` for how to invoke agents and run the swarm.