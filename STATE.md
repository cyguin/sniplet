# STATE.md — @cyguin/sniplet

## Current Slice

**Deployment — LIVE** — `sniplet-7ojdaegxo-joepros-projects.vercel.app` ✅

## Deployment Fixes (ongoing)

**Root cause**: `better-sqlite3` is a native C++ module that cannot compile on Vercel's serverless Node 24 environment. Fixed by switching example app to `postgres` adapter (pure JS, no native compilation).

**All 12 deployment issues resolved (this session):**

1. `file:../..` in example app's package.json → npm workspaces + `"*"` workspace dep
2. tsconfig.json path aliases overriding npm resolution → Removed aliases
3. `package-lock.json` pinning `file:../..` → Deleted lockfile
4. `better-sqlite3` native compilation failure → `optionalDependencies`; example uses `postgres`
5. `ECONNREFUSED` during `next build` → `PostgresAdapter` migration lazy
6. `throw new Error()` at module load time → Null-check returning 500
7. Missing try/catch in handler → Added wrapper, `await` on returns
8. Root Directory not set on Vercel → Joe set Root Directory to `examples/nextjs-app`
9. `dist/` not built before `next build` on Vercel → `prebuild` script + lifecycle hooks
10. `next build` not running on Vercel (stale `.next/` served) → Force-push commits + `BUILDING` state wait
11. **`POST /api/snips` returning 404** → Added `app/api/snips/route.ts` alongside `[...sniplet]/route.ts`
12. Vercel CLI token invalid → Use Vercel API directly for deployments

**Root cause of 404 on POST**: Next.js App Router production mode does not route `POST /api/snips` (zero URL segments after `/api/snips`) to `[...sniplet]`. The catch-all requires at least one matchable segment. Fixed by having both `app/api/snips/route.ts` (handles root `/api/snips`) and `app/api/snips/[...sniplet]/route.ts` (handles `/api/snips/:id`).

**Smoke test results** (2026-03-28):
- `POST /api/snips` → 201 ✅
- `GET /api/snips/:id` → 200 ✅
- `DELETE /api/snips/:id` → 204 ✅
- GET after delete → 404 ✅

**Workspace setup**: Root `package.json` has `workspaces: ["examples/nextjs-app"]` and `private: true`. Example app uses `@cyguin/sniplet: "*"` which resolves to workspace root.

**Vercel project**: `joepros-projects/sniplet`, Root Directory: `examples/nextjs-app`

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
- Writes `app/api/snips/route.ts` (root POST handler) and `app/api/snips/[...sniplet]/route.ts` (GET/DELETE)
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

Deployment is live. Snip creation, retrieval, and deletion all working on Vercel.

Remaining: verify the UI pages (`/snips` and `/snips/:id`) render correctly in production.

## Open Questions

- The SQLiteAdapter `delete()` method is silent on non-existent snips (no throw). Handler works around this by pre-checking existence with `get()` before delete. Consider whether to add a `deleteExists()` method to the adapter interface in a future slice.

## Deferred

- ESLint / Prettier config — not needed until later
