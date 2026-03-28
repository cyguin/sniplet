# STATE.md — @cyguin/sniplet

## Current Slice

**Slice 1 — Core Domain** (`feature/slice-1-core`)

## Completed

- `SnipletAdapter` interface exported from `src/core/types.ts`
- `Snip` and `CreateSnipInput` types exported from `src/core/types.ts`
- `SnipletError`, `SnipNotFoundError`, `SnipAlreadyBurnedError`, `SnipExpiredError` exported from `src/core/errors.ts`
- `SQLiteAdapter` fully implements `SnipletAdapter` with atomic burn-on-read
- `PostgresAdapter` fully implements `SnipletAdapter` with atomic burn-on-read
- Both adapters run idempotent migration on first use (CREATE TABLE IF NOT EXISTS)
- `sweep()` deletes expired snips and returns count on both adapters
- 15 vitest tests pass for SQLite adapter covering all TRUTH-6 cases
- Postgres tests skip gracefully when Docker is unavailable
- Zero TypeScript errors (`npx tsc --noEmit`)

## Files Changed

```
src/core/types.ts        — Snip, CreateSnipInput, SnipletAdapter interface
src/core/errors.ts       — SnipletError subclasses
src/core/adapter.ts      — re-exports SnipletAdapter
src/core/index.ts        — barrel export
src/index.ts             — package barrel export
src/adapters/sqlite.ts   — SQLiteAdapter implementation
src/adapters/postgres.ts — PostgresAdapter implementation
tests/sqlite.test.ts     — 15 tests for SQLiteAdapter
tests/postgres.test.ts   — 15 tests for PostgresAdapter (skips without Docker)
vitest.config.ts         — vitest configuration
tsconfig.json            — TypeScript configuration
tsup.config.ts           — tsup build configuration
package.json             — deps + package metadata
```

## Next

- **Slice 2** (`feature/slice-2-next-handler`): `src/next/` — createSnipletHandler(), rate limiting, HTTP status mapping

## Open Questions

- Postgres tests require Docker. CI environment needs Docker available to run full test suite.
- The `SnipletAdapter.get()` interface declares `Promise<Snip | null>` but implementation throws `SnipNotFoundError` per AGENTS.md throw-on-error convention. TypeScript allows covariant return types so this is fine in practice.

## Deferred

- ESLint / Prettier config — not needed until Slice 5
