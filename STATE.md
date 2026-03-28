# STATE.md — @cyguin/sniplet

## Current Slice

**Slice 2 — Next.js Route Handler** (`feature/slice-2-next-handler`)

## Completed

- `createSnipletHandler()` exported from `src/next/index.ts`
- Handles GET (view), POST (create), DELETE (delete) via catch-all route
- Error classes map correctly to HTTP status codes
- In-memory rate limiting middleware with IP-based keying
- `SnipletOptions` and `SnipletConfig` types exported
- All 17 vitest integration tests pass
- 32 vitest tests pass total (15 SQLite + 17 Next handler, 15 Postgres skipped)
- Zero TypeScript errors

## Files Changed

```
src/next/types.ts       — SnipletConfig, SnipletOptions, ExpiryOption types
src/next/middleware.ts  — in-memory rate limiter with IP keying
src/next/handler.ts     — createSnipletHandler, route dispatch, error mapping
src/next/index.ts       — barrel export
tests/next.test.ts      — 17 integration tests covering all TRUTH cases
package.json            — added next@14 as devDependency for test runtime
```

## Next

- **Slice 3** (`feature/slice-3-react`): `src/react/` — `<SnipCreate>` and `<SnipView>` components

## Open Questions

- The SQLiteAdapter `delete()` method is silent on non-existent snips (no throw). Handler works around this by pre-checking existence with `get()` before delete. Consider whether to add a `deleteExists()` method to the adapter interface in a future slice.

## Deferred

- ESLint / Prettier config — not needed until Slice 5
