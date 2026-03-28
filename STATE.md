# STATE.md — @cyguin/sniplet

## Current Slice

**Slice 5 — DX Polish** (`feature/slice-5-dx`) — complete

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

### Slice 4 — CLI Scaffolder ✅
- `npx @cyguin/sniplet init` scaffolding command
- Detects Next.js App Router project, installs dependency
- Writes `app/api/snips/[...sniplet]/route.ts` with SQLiteAdapter
- Writes `app/snips/page.tsx` and `app/snips/[id]/page.tsx`
- Prints `.env` snippet and next steps
- Exits cleanly if files already exist (no overwrite)
- Works on macOS and Linux

### Slice 5 — DX Polish ✅
- README.md with 10 sections in order: Header → What is this? → Quickstart → Manual Setup → Storage Adapters → Configuration → React Components → Exports → Requirements → License
- Quickstart is CLI-first (3 lines)
- Manual setup shows Postgres swap as a comment
- `examples/nextjs-app/` scaffolded with SQLiteAdapter default, PostgresAdapter via env var
- Example app uses `"@cyguin/sniplet": "file:../.."` for local dev
- All public exports have JSDoc with `@example` blocks
- `bin` field added to package.json (`sniplet` command)
- `cli` entry added to tsup.config.ts
- 32 vitest tests pass, zero TypeScript errors in root and example app

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
tests/next.test.ts       — 17 integration tests
package.json            — next@14 as devDependency
```

### Slice 3
```
src/react/SnipCreate.tsx — create form component
src/react/SnipView.tsx   — view/highlight component
src/react/index.tsx      — barrel export with JSDoc
package.json             — shiki, @types/react, @types/react-dom
tsconfig.json           — jsx: react-jsx
tsup.config.ts          — shiki added to external
```

### Slice 4
```
src/cli/index.ts        — CLI scaffolder implementation
```

### Slice 5
```
README.md               — 10-section README, CLI-first quickstart
examples/nextjs-app/    — full working example app
package.json            — bin field added
tsup.config.ts          — cli entry added
src/core/types.ts       — @example on SnipletAdapter, CreateSnipInput
src/core/errors.ts      — @example on SnipletError
src/next/types.ts       — @example on SnipletOptions, SnipletConfig
src/next/index.ts       — @example on createSnipletHandler
src/react/SnipCreate.tsx — JSDoc on props and component
src/react/SnipView.tsx   — JSDoc on props and component; useEffect deps fix
src/adapters/sqlite.ts  — @example on constructor
src/adapters/postgres.ts — @example on constructor
```

## Next

All slices complete. Ready for Joe to merge Slice 5 and publish.

## Open Questions

- The SQLiteAdapter `delete()` method is silent on non-existent snips (no throw). Handler works around this by pre-checking existence with `get()` before delete. Consider whether to add a `deleteExists()` method to the adapter interface in a future slice.

## Deferred

- ESLint / Prettier config — not needed until later
