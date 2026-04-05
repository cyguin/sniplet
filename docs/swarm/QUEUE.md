# Build Queue

> Managed by s-prd. Do not edit manually.

## State

- **Status:** `idle` | `running` | `paused` | `complete`
- **Current:** `[package name]` or empty
- **Started:** `[timestamp]` or empty
- **Last Updated:** `[timestamp]`

## Queue (in priority order)

| # | Package | State | Spec | Notes |
|---|---------|-------|------|-------|
| 1 | sniplet | queued | done | Overhaul: [...]cyguin + theming |
| 2 | changelog | queued | missing | Needs verification — code may exist |
| 3 | feedback | queued | missing | SUITE_CATALOG says "scoped" — verify |
| 4 | waitlist | queued | missing | SUITE_CATALOG says "scoped" — verify |
| 5 | uptime | queued | missing | Path B hosted SaaS |
| 6 | announce | queued | missing | Proposed |
| 7 | notify | queued | missing | Proposed |
| 8 | docs | queued | missing | Proposed |
| 9 | banner | queued | missing | Proposed |
| 10 | survey | queued | missing | Proposed |

## Completed

| Package | Signed Off | Published | Date |
|---------|------------|-----------|------|
| flag | ✅ | ❌ | 2026-04-04 |
| crisptrader | ✅ | ❌ | 2026-04-04 |
| sniplet | ❌ | v0.1.6 (old repo) | — |

## Paused At

- `[package name]` — `[reason]`

## Notes

- Run `/s-prd queue status` to see current state
- Run `/s-prd queue start` to begin processing
- Run `/s-prd queue pause` to stop at current item
- Queue processes in priority order (lowest number first)
- A package must have SPEC.md to be processed — s-prd will scope it first if missing
