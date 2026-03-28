# STATE.md — @cyguin/sniplet

## Current Slice

**Slice 4 — CLI Scaffolder** (`feature/slice-4-cli`)

## Completed

### Slice 1 — Core Domain ✅
- `SnipletAdapter` interface with `create`, `get`, `delete`, `sweep`
- `Snip` and `CreateSnipInput` types
- `SnipletError`, `SnipNotFoundError`, `SnipAlreadyBurnedError`, `SnipExpiredError`
- `SQLiteAdapter` with atomic burn-on-read (better-sqlite3 transaction)
- `PostgresAdapter` with atomic burn-on-read (UPDATE ... RETURNING)
- Both adapters run idempotent migration on first use
- Expiry sweep on both adapters
- 15 vitest unit tests pass

### Slice 2 — Next.js Route Handler ✅
- `createSnipletHandler()` exported from `src/next/index.ts`
- Handles GET (view), POST (create), DELETE (delete) via catch-all route
- Error classes map correctly to HTTP status codes
- In-memory rate limiting middleware with IP-based keying
- `SnipletOptions` and `SnipletConfig` types exported
- 17 vitest integration tests pass (32 total)
- Zero TypeScript errors

### Slice 3 — React Components ✅
- `<SnipCreate>` — textarea, language input, expiry select, burn-on-read checkbox, submit
- `<SnipView>` — fetches snip, async shiki highlighting, expiry countdown, 404/410 states
- Both accept `className` prop and forward to root element
- Both have `variant="tailwind"` option; base variant is unstyled (className-only)
- No bundled CSS — styles are className-only
- Client components (`'use client'`)
- shiki loaded async with plain-text fallback while loading
- SnipView useEffect deps array fixed — expression extracted to `highlightTrigger` const, no lint suppression

## Files Changed

### Slice 1
```
src/core/types.ts       — Snip, CreateSnipInput, SnipletAdapter
src/core/errors.ts      — SnipletError subclasses
src/adapters/sqlite.ts  — SQLiteAdapter
src/adapters/postgres.ts — PostgresAdapter
tests/adapters.test.ts  — 15 unit tests
```

### Slice 2
```
src/next/types.ts       — SnipletConfig, SnipletOptions, ExpiryOption
src/next/middleware.ts  — in-memory rate limiter
src/next/handler.ts     — createSnipletHandler, route dispatch, error mapping
src/next/index.ts       — barrel export
tests/next.test.ts      — 17 integration tests
package.json            — next@14 as devDependency
```

### Slice 3
```
src/react/SnipCreate.tsx — create form component
src/react/SnipView.tsx   — view/highlight component (useEffect deps fixed)
src/react/index.tsx      — barrel export with JSDoc
package.json             — shiki, @types/react, @types/react-dom
tsconfig.json           — jsx: react-jsx
tsup.config.ts          — shiki added to external
```

## Next

- **Slice 4** — CLI scaffolder: `npx @cyguin/sniplet init`, file generation, `--force` flag, Next.js App Router detection

## Open Questions

- The SQLiteAdapter `delete()` method is silent on non-existent snips (no throw). Handler works around this by pre-checking existence with `get()` before delete. Consider whether to add a `deleteExists()` method to the adapter interface in a future slice.

## Deferred

- ESLint / Prettier config — not needed until Slice 5
