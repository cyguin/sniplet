# DECISIONS.md — @cyguin/sniplet

## Slice 1 Decisions

### `get()` return type vs. throw convention

**Decision:** `SnipletAdapter.get()` throws `SnipNotFoundError` when a snip is not found, despite the interface declaring `Promise<Snip | null>`.

**Alternatives considered:**
1. Return `null` for not-found (matches interface signature literally) — but TRUTH-6 and AGENTS.md require throwing `SnipNotFoundError`
2. Change the interface to `Promise<Snip>` — would deviate from the exact type specified in AGENTS.md

**Rationale:** The AGENTS.md error convention ("All functions in src/core/ and src/adapters/ THROW typed errors on failure") takes precedence over the literal interface return type. TypeScript's covariant return types allow `Promise<Snip>` to satisfy `Promise<Snip | null>` without casting.

---

### SQLite schema uses TEXT for timestamps

**Decision:** SQLite schema stores timestamps as TEXT (ISO-8601 strings) rather than INTEGER (Unix epoch) or REAL (Julian day).

**Alternatives considered:**
1. INTEGER Unix epoch — simpler math, but less human-readable in raw DB reads
2. REAL Julian day — standard for SQLite date math, but requires cast on every read
3. TEXT ISO-8601 — stored as `datetime('now')`, parsed as `new Date()` in JS — zero config, human-readable

**Rationale:** Matches the SQLite idiomatic approach. `new Date()` handles ISO-8601 natively. The Postgres adapter uses native TIMESTAMPTZ; both representations are ISO-8601 compatible.

---

### SQLite WAL mode enabled on open

**Decision:** `db.pragma('journal_mode = WAL')` is set on SQLite adapter construction.

**Rationale:** WAL mode allows concurrent reads during writes and improves performance for a snip-sharing workload. It's safe — if WAL is not supported (older SQLite), the pragma silently fails and falls back to default.

---

### Expiry check order: burn-on-read fires before expiry check

**Decision:** When a snip is both burn-on-read AND expired, burn-on-read fires on the first GET and returns content; the second GET then sees `burned_at IS NOT NULL` and throws `SnipAlreadyBurnedError`.

**Alternatives considered:**
1. Expiry check fires first — expired snips are inaccessible even if they're burn-on-read
2. Burn-on-read fires first — content is delivered once before expiry check

**Rationale:** This matches the semantic meaning of "burn on read" — the content is consumed on access. Expiry is a background cleanup mechanism (sweep), not a pre-read gate for burn-on-read snips. The test `'checks burned before expired'` confirms this contract.

---

### Postgres container name uses random UUID suffix

**Decision:** Each test run spins up a container with a unique name derived from `randomUUID()`.

**Rationale:** Avoids collisions if a previous test run's container wasn't cleaned up. `docker rm` in afterAll handles cleanup.
