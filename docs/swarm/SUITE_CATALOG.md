# @cyguin npm Suite — Product Catalog

> **Role:** Swarm Product Manager (`s-prd`)  
> **Purpose:** Authoritative reference for all Cyguin npm packages — existing, scoped, and proposed. Updated before each sprint.

---

## Brand Standards

### Design Tokens

Every `@cyguin` package uses CSS custom properties for theming. No hardcoded colors.

#### Token Sheet

```css
/* ── Light (default) ─────────────────────────── */
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

/* ── Dark / Cyguin Native ────────────────────── */
--cyguin-bg:           #0a0a0a
--cyguin-bg-subtle:    #1a1a1a
--cyguin-border:       #2a2a2a
--cyguin-border-focus: #f5a800
--cyguin-fg:           #f5f5f5
--cyguin-fg-muted:     #888888
--cyguin-accent:       #f5a800
--cyguin-accent-dark:  #c47f00
--cyguin-accent-fg:    #0a0a0a
--cyguin-radius:       6px
--cyguin-shadow:       0 1px 4px rgba(0,0,0,0.4)
```

#### Token Reference

| Token | Used On |
|-------|---------|
| `--cyguin-bg` | Component background, modals, panels |
| `--cyguin-bg-subtle` | Input fields, hover states, zebra rows |
| `--cyguin-border` | All borders, dividers |
| `--cyguin-border-focus` | Focus ring on inputs, focused elements |
| `--cyguin-fg` | Primary text |
| `--cyguin-fg-muted` | Labels, timestamps, secondary text |
| `--cyguin-accent` | Buttons, links, active states, badges |
| `--cyguin-accent-dark` | Button hover, pressed states |
| `--cyguin-accent-fg` | Text rendered on accent background |
| `--cyguin-radius` | All border-radius |
| `--cyguin-shadow` | Dropdowns, modals, floating elements |

#### Theme Rules

- `theme="light"` is the install default
- `theme="dark"` is the Cyguin brand switch (one prop)
- `--cyguin-accent` and `--cyguin-accent-fg` are **identical** between themes — amber is always amber
- `--cyguin-fg-muted` is identical between themes — `#888888` works on both
- `--cyguin-radius` and layout tokens never change
- Only tokens that flip between themes: `bg`, `bg-subtle`, `border`, `fg`, `shadow`
- **No raw hex in component code** — always use tokens

#### Brand Colors

| Name | Hex | Source |
|------|-----|--------|
| `--cyguin-black` | `#0a0a0a` | Body — near-black |
| `--cyguin-amber` | `#f5a800` | Iris ring — primary brand |
| `--cyguin-amber-dark` | `#c47f00` | Talons/beak |
| `--cyguin-pupil` | `#1a2a3a` | Pupil — deep blue-black |
| `--cyguin-white` | `#f5f5f5` | Neutral light |
| `--cyguin-muted` | `#888888` | Secondary text |

---

## Package Architecture

### Shared Conventions

| Concern | Implementation |
|---------|----------------|
| IDs | `nanoid` |
| SQLite | `better-sqlite3`, WAL mode |
| Postgres | `porsager/postgres` |
| Bundler | `tsup`, dual ESM/CJS output |
| Tests | `vitest` |
| Theming | CSS custom properties, light default / dark Cyguin |
| Route pattern | `app/api/[package]/[...cyguin]/route.ts` |
| Adapter pattern | `SQLiteAdapter` / `PostgresAdapter` implementing shared interface |

### The Drop-In Contract

Every package follows the next-auth / uploadthing pattern:

1. `npm install @cyguin/[package]`
2. Configure an adapter (SQLite or Postgres)
3. Add the catch-all route handler
4. Drop in the component

---

## Existing Packages

### @cyguin/sniplet

**What it is:** Code snippet manager. Drop-in snippet sharing for Next.js apps — create, share, and render syntax-highlighted code snippets with burn-on-read and expiry support.

**Status:** Published v0.1.6 on npm — 283 downloads/week  
**Repo:** https://github.com/joeproit/sniplet (separate from project23 monorepo)  
**In overhaul:** Target v0.2.0 — reabsorb into project23, migrate route to `[...cyguin]`, apply `--cyguin-*` theme tokens. See `docs/swarm/sniplet/SPEC.md`.

**Quickstart:** `npx @cyguin/sniplet init` then visit `/snips`

**Core API surface:**
- Route: `app/api/snips/[...sniplet]/route.ts`
- Handler: `createSnipletHandler` from `@cyguin/sniplet/next`
- Components: `<SnipCreate />`, `<SnipView />` from `@cyguin/sniplet/react`
- Syntax highlighting: shiki
- Variants: `base` (unstyled) or `tailwind`

**Exports:**
| Import | What you get |
|--------|-------------|
| `@cyguin/sniplet` | `Snip`, `CreateSnipInput`, `SnipletAdapter`, `SnipletError` subclasses |
| `@cyguin/sniplet/next` | `createSnipletHandler`, `SnipletConfig`, `SnipletOptions`, `ExpiryOption` |
| `@cyguin/sniplet/react` | `SnipCreate`, `SnipView` |
| `@cyguin/sniplet/adapters/sqlite` | `SQLiteAdapter` |
| `@cyguin/sniplet/adapters/postgres` | `PostgresAdapter` |

**Configuration:**
```ts
createSnipletHandler({
  adapter,
  options: {
    maxLength: 100_000,      // max content bytes
    defaultExpiry: '7d',    // default expiry
    allowAnonymous: true,    // allow anonymous creates
    rateLimit: { window: '1m', max: 30 },
  },
})
```

**Requirements:** Next.js 14+, Node.js 20+, React 18+

---

### @cyguin/changelog

**What it is:** Changelog publisher. Drop-in changelog feed for SaaS apps — write entries, publish them, render them in-app or on a public page.

**Status:** Built, pre-publish — needs NPM_TOKEN secret in Forgejo, merge open PR, push v0.1.0 tag to trigger Actions publish workflow.

**Core API surface:**
- Catch-all route: `app/api/changelog/[...cyguin]/route.ts`
- Components: `<ChangelogFeed />`, `<ChangelogEntry />`
- Admin API: create, update, publish, unpublish entries

**DB schema:**
```sql
CREATE TABLE changelog_entries (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  published_at INTEGER,
  created_at INTEGER NOT NULL
);
```

**Adapters:** SQLiteAdapter, PostgresAdapter

---

### @cyguin/flag

**What it is:** Feature flags. Drop-in boolean and percentage-rollout flag evaluation for Next.js App Router. Server-side and client-side flag reads.

**Status:** Built, pre-publish — same pipeline as changelog.

**Core API surface:**
- Server function: `isEnabled('flag-name', userId?)`
- Component: `<Flag name="flag-name"><NewFeature /></Flag>`
- Admin API: create, enable, disable, set rollout percentage

**DB schema:**
```sql
CREATE TABLE flags (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 0,
  rollout_pct INTEGER NOT NULL DEFAULT 100,
  allowlist_ids TEXT NOT NULL DEFAULT '[]',
  created_at INTEGER NOT NULL
);
```

**Key discovery:** Export naming conflict — `Flag` type (data) vs `Flag` component (React). Fixed by renaming type to `FlagData`.

**Adapters:** SQLiteAdapter, PostgresAdapter

---

## Scoped — Not Yet Built

### @cyguin/feedback

**What it is:** User feedback widget. Drop-in component that captures structured feedback (thumbs, rating, or free text) from users inside a running app.

**Status:** Fully scoped — architecture, component API, adapter implementation, and sprint breakdown complete. Highest priority build in queue.

**Core API surface:**
- Catch-all route: `app/api/feedback/[...cyguin]/route.ts`
- Component: `<FeedbackWidget />`
- Admin read API: list submissions, mark reviewed

**DB schema:**
```sql
CREATE TABLE feedback (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  type TEXT NOT NULL,
  body TEXT NOT NULL,
  url TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
```

**Adapters:** SQLiteAdapter, PostgresAdapter

---

### @cyguin/waitlist

**What it is:** Waitlist capture. Drop-in email collection and position management for pre-launch apps.

**Status:** Fully scoped — architecture, README, and five slice spec docs (SLICE-1-core.md through SLICE-5-publish.md) ready. Not yet built.

**Core API surface:**
- Catch-all route: `app/api/waitlist/[...cyguin]/route.ts`
- Component: `<WaitlistForm />`
- Position: soft queue recalculated on read via `ROW_NUMBER()`, not stored
- Referral loop: optional invite token system

**DB schema:**
```sql
CREATE TABLE waitlist_entries (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  referred_by TEXT,
  joined_at INTEGER NOT NULL,
  burned_at INTEGER
);
```

**Adapters:** SQLiteAdapter, PostgresAdapter

---

### @cyguin/uptime

**What it is:** Uptime monitoring and public status page. Vercel cron-based ping runner with auto-incident detection and a public-facing ISR status page.

**Status:** Scoped. **Path B — hosted SaaS, not an npm library.** Separate effort from the library suite but same brand and audience.

**Core architecture:**
- Vercel cron pings configured endpoints on interval
- Auto-incident logic: N consecutive failures → incident created
- Public status page via Next.js ISR — no auth required to view
- Admin dashboard: manage monitors, view history, acknowledge incidents

**DB schema:**
```sql
CREATE TABLE monitors (id, url, interval, created_at);
CREATE TABLE pings (id, monitor_id, ok, latency_ms, checked_at);
CREATE TABLE incidents (id, monitor_id, started_at, acknowledged_at, resolved_at);
```

**Hosting:** `uptime.cyguin.com` — Vercel + Neon

---

## Proposed — Not Yet Scoped

### Build Priority Order

```
feedback → waitlist → flag → announce → notify → docs → banner → survey
uptime (Path B hosted SaaS — separate track)
```

---

### @cyguin/announce

**What it is:** In-app announcement banner. DB-backed, per-user dismissible banner for maintenance windows, feature announcements, or price change notices.

**Why it fits:**
- Pure adapter pattern
- Single dismissible banner component
- Direct complement to `@cyguin/changelog` — announce the changelog entry
- Natural upsell: hosted tier lets non-technical founders push announcements without a deploy

**MVP scope:**
- Admin API to create/update/delete announcements
- Per-user dismiss state in DB (or cookie-based for anon)
- `<AnnouncementBanner />` React component
- `app/api/announce/[...cyguin]/route.ts` catch-all handler

**Score:** 10–11/12 — high pain, high distribution, trivial build

**DB schema:**
```sql
CREATE TABLE announcements (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  active_from INTEGER,
  active_until INTEGER,
  created_at INTEGER NOT NULL
);

CREATE TABLE announcement_dismissals (
  user_id TEXT NOT NULL,
  announcement_id TEXT NOT NULL,
  dismissed_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, announcement_id)
);
```

**Adapters:** SQLiteAdapter, PostgresAdapter

---

### @cyguin/notify

**What it is:** Server-triggered in-app user notifications. Notify specific users of async events (export ready, trial expiring, payment failed) without email. Polling-based MVP, SSE in v2.

**Why it fits:**
- Polling-based (no websockets for MVP)
- Same adapter pattern
- Very high surface area — every SaaS eventually needs this
- Strong hosted tier story

**MVP scope:**
- `notify(userId, { title, body, href? })` server function
- Notifications stored in DB with read/unread state
- `<NotificationBell />` component — polling interval, badge count, dropdown
- Mark as read on click

**Score:** 8/12 — medium complexity, high surface area

**DB schema:**
```sql
CREATE TABLE notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  href TEXT,
  read_at INTEGER,
  created_at INTEGER NOT NULL
);
```

**Adapters:** SQLiteAdapter, PostgresAdapter

---

### @cyguin/banner

**What it is:** Cookie consent and GDPR notice. Correct, auditable, drop-in consent management.

**Why it fits:**
- Legally required surface area = guaranteed demand
- Consent state in DB (audit trail) or cookie (simpler)
- Very small scope — one component, one handler, one DB table
- Fast build: 1–2 slices

**MVP scope:**
- `<ConsentBanner />` component
- `app/api/banner/[...cyguin]/route.ts` catch-all handler
- Consent record: accept/reject stored with timestamp

**Score:** 9/12 — moderate pain but universal legal requirement

**DB schema:**
```sql
CREATE TABLE consent_records (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  decision TEXT NOT NULL,
  categories TEXT NOT NULL DEFAULT '[]',
  created_at INTEGER NOT NULL
);
```

**Adapters:** SQLiteAdapter, PostgresAdapter

---

### @cyguin/docs

**What it is:** Embeddable help and docs widget. Searchable, markdown-backed, renders as an in-app sidebar or modal.

**Why it fits:**
- Content in DB or flat file (both adapter-friendly)
- `<DocsWidget />` renders searchable modal
- Hosted tier: founders write docs in dashboard, no redeploy required
- Natural companion to `@cyguin/feedback` — "did this article help? No → show feedback widget"

**MVP scope:**
- `app/api/docs/[...cyguin]/route.ts` catch-all route
- `<DocsWidget />` — searchable modal, markdown rendered
- Admin API: create, update, order articles, organize sections

**Score:** 10/12 — strong pain, strong hosted tier story

**DB schema:**
```sql
CREATE TABLE doc_articles (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  body_md TEXT NOT NULL,
  section TEXT NOT NULL,
  article_order INTEGER NOT NULL,
  published_at INTEGER
);
```

**Adapters:** SQLiteAdapter, PostgresAdapter

---

### @cyguin/survey

**What it is:** Post-action micro-survey. Structured 1–3 question modal triggered on specific app events — cancel flow, post-upgrade, onboarding completion.

**Why it fits:**
- Complement to `@cyguin/feedback`, not a duplicate — trigger API is the differentiator
- DB schema: surveys, questions, responses — straightforward
- Hosted tier: view aggregate responses without building your own dashboard

**MVP scope:**
- `showSurvey('churn-survey', userId)` trigger API
- `<SurveyModal />` component
- Question types: NPS scale, multiple choice, short text
- Admin API: create surveys, define questions, view aggregate responses

**Score:** 9/12 — solid but more complex, lower urgency

**DB schema:**
```sql
CREATE TABLE surveys (
  id TEXT PRIMARY KEY,
  trigger TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL
);

CREATE TABLE survey_questions (
  id TEXT PRIMARY KEY,
  survey_id TEXT NOT NULL,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL,
  question_order INTEGER NOT NULL
);

CREATE TABLE survey_responses (
  id TEXT PRIMARY KEY,
  question_id TEXT NOT NULL,
  user_id TEXT,
  answer TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
```

**Adapters:** SQLiteAdapter, PostgresAdapter

---

## Build Order Summary

| Priority | Package | Status | Path |
|----------|---------|--------|------|
| 1 | @cyguin/sniplet | Overhaul: v0.2.0 | project23 — `[...cyguin]` + theming |
| 2 | @cyguin/changelog | Built, pre-publish | npm |
| 3 | @cyguin/flag | Built, pre-publish | npm |
| 4 | @cyguin/feedback | Scoped, not built | npm |
| 5 | @cyguin/waitlist | Scoped, not built | npm |
| 6 | @cyguin/uptime | Scoped, not built | Path B hosted SaaS |
| 7 | @cyguin/announce | Proposed | npm |
| 8 | @cyguin/notify | Proposed | npm |
| 9 | @cyguin/docs | Proposed | npm |
| 10 | @cyguin/banner | Proposed | npm |
| 11 | @cyguin/survey | Proposed | npm |

---

## Suite Cohesion

The real play: **@cyguin becomes the operational layer for indie Next.js SaaS** — the tools every bootstrapper needs but no one has packaged cleanly.

Each package is:
- A standalone product
- A distribution node for every other package

**The hosted tier convergence:** `cyguin.com/dashboard` — one place to manage flags, announcements, changelogs, feedback, and uptime for your app.

That's where the real recurring revenue is. Individual packages are the moat-building phase.

**Architecture target:** 6-month horizon for the unified dashboard.

---

## Cross-Cutting Concerns

### Lazy Initialization

Build-time env vars are not available. DB client (Neon), Resend, and Stripe all need lazy instantiation to avoid build errors.

### drizzle.config.ts

Must use `.mjs` extension to avoid Next.js TypeScript compilation issues.

### Drizzle Query Methods

Pass `schema` to `drizzle()` call to enable `.query.users.findFirst()` pattern.

### Metals.dev API (for future reference)

- Auth via query param `?api_key=xxx` (NOT header)
- Metal codes: `gold`/`silver`/`platinum`/`palladium` (NOT XAU/XAG)
- Free tier: 100 req/month only

---

## Open Issues

| Package | Issue | Blocker |
|---------|-------|---------|
| sniplet | v0.1.6 on npm, separate repo — needs reabsorb + overhaul | Launch sniplet overhaul |
| changelog | Needs NPM_TOKEN secret in Forgejo | Publish |
| flag | Needs NPM_TOKEN secret in Forgejo | Publish |
| crisptrader | Full Next.js app, private: true — Path B SaaS | Classification |
