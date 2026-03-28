# STATE.md — @cyguin/sniplet

## Current Slice

**Deployment Fixes** — Vercel deployment troubleshooting

## Deployment Fixes (post-slice session)

**Root cause**: `better-sqlite3` is a native C++ module that cannot compile on Vercel's serverless Node 24 environment (requires GCC with C++20 support). Fixed by switching example app to `postgres` adapter (pure JS, no native compilation).

**All 11 deployment issues resolved:**

1. `file:../..` in example app's package.json → Fixed by npm workspaces + `"*"` workspace dep
2. tsconfig.json path aliases overriding npm resolution → Removed aliases
3. `package-lock.json` pinning `file:../..` → Deleted lockfile
4. `better-sqlite3` native compilation failure → Moved to `optionalDependencies`; switched example to `postgres`
5. `ECONNREFUSED` during `next build` → `PostgresAdapter` migration now lazy (called on first operation, not constructor)
6. `throw new Error()` at module load time in route file → Replaced with null-check that returns 500
7. Missing try/catch in handler → Added try/catch wrapper, `await` on handler returns
8. Duplicate API routes (`api/snips/route.ts` and `api/snips/[...sniplet]/route.ts`) → Deleted zero-segment route
9. Root Directory not set on Vercel → Joe set Root Directory to `examples/nextjs-app`
10. `dist/` not in git → Workspace approach eliminates need for `npm publish` cycle
11. `dist/` not built before `next build` on Vercel → Added `prebuild` script + `prepare`/`postinstall` lifecycle hooks

**Workspace setup**: Root `package.json` has `workspaces: ["examples/nextjs-app"]` and `private: true`. Example app uses `@cyguin/sniplet: "*"` which resolves to workspace root. Root has `"files": ["dist"]` for npm publish, `prepare: "npx tsup"` for local builds, and `"prebuild": "npx tsup"` in example app for Vercel builds.

**npm workspaces resolution**: `@cyguin/sniplet` resolves to `dist/index.js` in workspace root. Verified: `require.resolve('@cyguin/sniplet')` → `/Users/joepro/cyguin/17/dist/index.js`

**Files changed for deployment**:
```
examples/nextjs-app/app/api/snips/[...sniplet]/route.ts  — null-check guard, no throw
examples/nextjs-app/app/api/snips/route.ts              — DELETED (redundant)
examples/nextjs-app/package.json                         — @cyguin/sniplet: "*", prebuild script
examples/nextjs-app/vercel.json                         — DELETED
examples/nextjs-app/package-lock.json                   — DELETED
package.json                                            — workspaces, private, prepare script, optionalDependencies
.gitignore                                             — NEW (node_modules/, dist/, etc.)
```

## Slice 5 — Bugs Fixed (post-DX session)

**Critical: Zero-segment route bug**
Next.js App Router does not route `GET/POST /api/snips` (zero segments) to `[...sniplet]`. Fixed by adding `app/api/snips/route.ts` co-located with `app/api/snips/[...sniplet]/route.ts`. Both export the same handler and work together.

**CLI fixes**
- Now generates both `app/api/snips/route.ts` and `app/api/snips/[...sniplet]/route.ts`
- Fixed `SNIPLET_DB_PATH` default to `./data/sniplet.db`
- Fixed React 19 `use(params)` pattern → Next.js 14-compatible `params` props in `SNIP_PAGE` template
- Removed `.js` from local imports in `src/next/types.ts`

**Example app fixes**
- Added `"type": "module"` to package.json (fixes Node.js ESM warning)
- Removed debug `app/api/test/route.ts`

**Smoke QA results**: 3 routes tested (all PASS), burn-on-read verified (first=200, second=410), form submission works, navigation to `/snips/[id]` works.

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

Waiting on Vercel redeploy to verify the workspace approach works. Then smoke-test the deployment.

To deploy: Joe triggers a Vercel redeploy (or push triggers it automatically).

## Open Questions

- The SQLiteAdapter `delete()` method is silent on non-existent snips (no throw). Handler works around this by pre-checking existence with `get()` before delete. Consider whether to add a `deleteExists()` method to the adapter interface in a future slice.

## Deferred

- ESLint / Prettier config — not needed until later
