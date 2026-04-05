# Cyguin Swarm - Usage Guide

## Overview

The Cyguin Swarm is an autonomous multi-agent system that builds @cyguin npm packages from idea to completion. This guide explains how to use the system.

## Quick Start

### 1. Start the Swarm

To begin a new project, give the swarm an idea:

```
User: Build @cyguin/flag - feature flags for Next.js apps
```

### 2. The Swarm Responds

/s-mgr will ask clarifying questions:
- What problem does this solve?
- What's the core use case?
- Any specific requirements?
- Target users?

### 3. Review and Approve

You'll receive SPEC_DRAFT.md. Review and:
- **Approve**: Work begins
- **Reject**: Provide feedback, /s-mgr revises
- **Revise**: Request specific changes

---

## Agent Invocation

### Manual Invocation

Each agent can be invoked directly:

```
/s-mgr    - Start new project intake
/s-prj    - Check project status
/s-ref    - Run reference research  
/s-res    - Run technical research
/s-dev1   - Developer 1
/s-dev2   - Developer 2
/s-qa1    - QA Tester 1
/s-qa2    - QA Tester 2
/s-signoff - Run final signoff
```

### Via /s-prj

The project manager coordinates everything. Just talk to /s-prj:

```
/s-prj: What's the current status?
/s-prj: Pause the project
/s-prj: Resume the project
/s-prj: Force checkpoint
```

---

## Project Lifecycle

### Phase 1: Intake (/s-mgr)
```
You → Idea
↓
//s-mgr asks questions
↓
//s-mgr writes SPEC_DRAFT.md
↓
You approve/reject
```

### Phase 2: Research (/s-ref + /s-res)
```
/s-ref → References
/s-res → Technical details
↓
Both → CONTEXT.md
↓
Optional: Your approval to start dev
```

### Phase 3: Development (/s-dev1 + /s-dev2)
```
Parallel dev work
↓
Checkpoints every 3 features
↓
DEV_COMPLETE signal
```

### Phase 4: QA (/s-qa1 + /s-qa2)
```
Parallel QA testing
↓
If bugs: loop to dev (max 3x)
↓
QA_COMPLETE signal
```

### Phase 5: Signoff (/s-signoff)
```
Validate against SPEC
↓
COMPLETE: Notify you
INCOMPLETE: Loop to dev
PARTIAL: Ask accept/reject
```

### Phase 6: Completion
```
You receive notification
↓
Accept: Done
Reject: Restart from intake
```

---

## Files Created

### Project Folder Structure
```
/docs/swarm/[project-name]/
├── SPEC.md              # Approved spec
├── SPEC_DRAFT.md        # Pre-approval draft
├── STATUS.md            # Live progress
├── CONTEXT.md           # Shared memory
├── DEV_LOG.md           # Dev coordination
├── .env                 # Secrets (600)
├── ENV.md               # Secret references
├── research/
│   ├── references.md
│   └── tech-details.md
└── qa/
    ├── REPORT.md
    └── BUGS.md

/packages/[project-name]/
├── src/
├── package.json
├── tsconfig.json
├── README.md
└── examples/
```

---

## Commands

### Check Project Status
```
# Read STATUS.md directly
cat /docs/swarm/[project]/STATUS.md
```

### Pause Project
```
# Edit STATUS.md, set status to "paused"
# /s-prj will pause at next checkpoint
```

### Resume Project
```
# Edit STATUS.md, set status to "active"
# /s-prj picks up from last checkpoint
```

### Force Checkpoint
```
# Tell /s-prj to checkpoint now
/s-prj: Force checkpoint
```

---

## Troubleshooting

### Agent Stuck
- Wait 10 minutes for auto-escalation
- Or manually check: `cat /docs/swarm/[project]/STATUS.md`

### Build Fails
- QA loops to dev with BUGS.md
- Dev fixes, re-tests
- Max 3 attempts before escalation

### Want to Change Spec Mid-Build
```
# Edit SPEC.md with changes
# /s-prj detects diff
# Loops to affected phase
```

### Want to Inspect Progress
```
# Check STATUS.md
cat /docs/swarm/[project]/STATUS.md

# Check DEV_LOG.md
cat /docs/swarm/[project]/DEV_LOG.md
```

---

## Current Projects

To see active projects:
```bash
ls /docs/swarm/
```

---

## First Project: @cyguin/flag

Let's test the swarm with:
- Package: @cyguin/flag (feature flags)
- Spec: Already established in your research docs

**Ready to start? Just tell the swarm your idea!**

```
Build @cyguin/flag - feature flags for Next.js apps with percentage rollouts
```