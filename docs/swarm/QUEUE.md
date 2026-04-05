# Build Queue

> Managed by s-prd. Do not edit manually.

## State

- **Status:** `running`
- **Current:** `sniplet`
- **Started:** `2026-04-04`
- **Last Updated:** `2026-04-04`

## Queue (in priority order after daily digest)

| # | Package | State | Spec | Effort | Notes |
|---|---------|-------|------|--------|-------|
| 1 | sniplet | **building** | done | 3 | Overhaul: [...]cyguin + theming |
| 2 | announce | queued | done | 2 | Proposed, confirmed gap — no drop-in exists |
| 3 | banner | queued | missing | 1–2 | Proposed, confirmed gap — abandonware landscape |
| 4 | notify | queued | missing | 3 | Proposed, confirmed gap — no self-hostable option |
| 5 | feedback | queued | missing | 3 | Scoped in SUITE_CATALOG |
| 6 | waitlist | queued | missing | 3 | Scoped in SUITE_CATALOG |
| 7 | docs | queued | missing | 3–4 | Medium effort |
| 8 | survey | queued | missing | 4 | More complex, lower urgency |
| 9 | uptime | queued | missing | — | Path B hosted SaaS — separate track |

## Completed

| Package | Signed Off | Published | Date |
|---------|------------|-----------|------|
| flag | ✅ | ❌ | 2026-04-04 |
| crisptrader | ✅ | ❌ | 2026-04-04 |

## Paused At

- `` — ``

## Notes

- Run `/s-prd queue status` to see current state
- Run `/s-prd queue pause` to stop at current item
- Queue processes in priority order (lowest number first)
- A package must have SPEC.md to be processed — s-prd scopes it first if missing
- Daily digest run 2026-04-04: confirmed existing queue items are valid gaps
