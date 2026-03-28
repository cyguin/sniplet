# DECISIONS.md — @cyguin/sniplet

## Slice 2 Decisions

### DELETE returns 404 via pre-check workaround

**Decision:** The handler's `handleDelete()` calls `adapter.get(id)` before `adapter.delete(id)` to detect non-existent snips and return 404.

**Alternatives considered:**
1. Rely on `adapter.delete()` throwing on non-existent snips — it doesn't, it silently succeeds
2. Add a `snipExists(id)` method to the adapter interface — would require adapter changes and Slice 1 scope

**Rationale:** The adapter silently succeeds on delete of non-existent snips. The spec requires 404 for DELETE on unknown snip. The most minimal fix is a pre-check in the handler layer. This doesn't affect the adapter interface and keeps the change localized.

---

### Rate limiter fails open on unknown IP

**Decision:** When client IP cannot be determined from headers (`x-forwarded-for`, `x-real-ip`), the rate limiter returns `'allowed'` rather than blocking.

**Rationale:** Prevents lockout in environments where IP headers are not available (e.g., localhost, certain proxies). The security trade-off is acceptable in v1 since rate limiting is a DOS protection mechanism, not an auth boundary.

---

## Slice 1 Decisions

### `get()` return type: `Promise<Snip>` throws on not-found

**Decision:** `SnipletAdapter.get()` has return type `Promise<Snip>` (no `| null`) and throws `SnipNotFoundError` when a snip is not found.

**Alternatives considered:**
1. Return `null` for not-found — null returns are ambiguous in a typed error system and inconsistent with the throw convention
2. Keep `| null` in interface with covariant workaround — leaves an incorrect signal in the public API

**Rationale:** Joe confirmed the `| null` was a spec mistake. The throw convention is correct — null returns are ambiguous when all other error cases throw typed errors. Interface updated to match implementation.

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
