# @cyguin/sniplet — Overhaul Spec

## Status: Scoped

## Problem

The published `@cyguin/sniplet` v0.1.6 (283 downloads/week) was built with a different architecture than the rest of the Cyguin suite. It's in a separate repo (`joeproit/sniplet`) and doesn't follow the planned `[...cyguin]` catch-all route pattern. It needs to be reabsorbed into `project23` with proper Cyguin suite conventions applied.

## Goal

Reabsorb `@cyguin/sniplet` into `project23/packages/sniplet/` with:
1. The `[...cyguin]` catch-all route convention
2. `--cyguin-*` CSS custom property theming (light default, dark Cyguin)
3. Same adapter pattern as the rest of the suite
4. All existing functionality preserved (create/view, shiki, burn-on-read, expiry, rate limit)

## What to Preserve

From v0.1.6:
- `SnipCreate` + `SnipView` React components
- Shiki syntax highlighting
- Burn-on-read and expiry support
- SQLite and Postgres adapters
- Rate limiting
- `base` and `tailwind` variants

## What to Change

| Aspect | v0.1.6 (current) | Target (new) |
|--------|------------------|--------------|
| Route | `app/api/snips/[...sniplet]/route.ts` | `app/api/snips/[...cyguin]/route.ts` |
| Theme | Unstyled or tailwind variant only | `--cyguin-*` CSS tokens applied |
| Package exports | `@cyguin/sniplet/next`, `@cyguin/sniplet/react` | Same export structure, but route segment is `[...cyguin]` |
| Init CLI | `npx @cyguin/sniplet init` | Same |
| Repo | `joeproit/sniplet` | `cyguin/project23/packages/sniplet/` |
| Adapters | Custom SQLite/Postgres | Shared adapter interface |

## API Surface

### Route Handler
```
app/api/snips/[...cyguin]/route.ts
```
Handlers: GET, POST, DELETE

### Server Functions (from `@cyguin/sniplet/next`)
- `createSnipletHandler({ adapter, options })` — same as v0.1.6
- `SnipletConfig`, `SnipletOptions`, `ExpiryOption` — same as v0.1.6

### React Components (from `@cyguin/sniplet/react`)
- `<SnipCreate />` — same props as v0.1.6, now themed with `--cyguin-*`
- `<SnipView />` — same props as v0.1.6, now themed with `--cyguin-*`

### Adapters (from `@cyguin/sniplet/adapters/*`)
- `SQLiteAdapter` — same as v0.1.6
- `PostgresAdapter` — same as v0.1.6

### Exports
| Import | What you get |
|--------|-------------|
| `@cyguin/sniplet` | `Snip`, `CreateSnipInput`, `SnipletAdapter`, `SnipletError` subclasses |
| `@cyguin/sniplet/next` | `createSnipletHandler`, `SnipletConfig`, `SnipletOptions`, `ExpiryOption` |
| `@cyguin/sniplet/react` | `SnipCreate`, `SnipView` |
| `@cyguin/sniplet/adapters/sqlite` | `SQLiteAdapter` |
| `@cyguin/sniplet/adapters/postgres` | `PostgresAdapter` |

## Theme Implementation

Apply these tokens to `SnipCreate` and `SnipView` components:

```css
/* Light (default) */
--cyguin-bg:           #ffffff
--cyguin-bg-subtle:    #f5f5f5
--cyguin-border:       #e5e5e5
--cyguin-border-focus: #f5a800
--cyguin-fg:           #0a0a0a
--cyguin-fg-muted:     #888888
--cyguin-accent:       #f5a800
--cyguin-accent-dark:  #c47f00
--cyguin-accent-fg:    #0a0a0a
--cyguin-radius:       6px
--cyguin-shadow:       0 1px 4px rgba(0,0,0,0.08)
```

All component styles must use these tokens — no raw hex values.

## DB Schema

```sql
CREATE TABLE snips (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  language TEXT NOT NULL,
  content TEXT NOT NULL,
  burn_on_read INTEGER NOT NULL DEFAULT 0,
  expires_at INTEGER,
  view_count INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);
```

## Slices

### Slice 1 — Scaffold + Route Migration
- Create `packages/sniplet/` tsup project
- Migrate handler from `next/` to `[...cyguin]` route
- Dual ESM/CJS build output
- Package.json with all exports map entries

### Slice 2 — Theming
- Apply `--cyguin-*` tokens to `SnipCreate`
- Apply `--cyguin-*` tokens to `SnipView`
- No raw hex in component styles
- Light theme default, dark theme via `theme="dark"` prop

### Slice 3 — Adapters + Testing
- Verify SQLite adapter works
- Verify Postgres adapter works
- `npm run build` passes
- `npm run lint` passes (if present)

### Slice 4 — Publish
- Merge to staging
- Publish v0.2.0 to npm
- Deprecate `joeproit/sniplet` repo (or archive)

## Migration Path for Existing Users

v0.1.6 users need to:
1. Update route from `[...sniplet]` to `[...cyguin]`
2. No other changes needed — same component API, same adapters

## Acceptance Criteria

- [ ] Route uses `[...cyguin]` pattern
- [ ] `--cyguin-*` CSS tokens applied to all components
- [ ] Light theme default, dark available via prop
- [ ] `npm run build` passes (ESM + CJS)
- [ ] All v0.1.6 functionality preserved
- [ ] SQLite and Postgres adapters work
- [ ] Published to npm as v0.2.0
- [ ] README updated with correct route and theme docs
