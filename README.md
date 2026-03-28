# @cyguin/sniplet

Drop-in snippet sharing for Next.js apps. No external service. No separate deployment. You own your data.

Follows the `next-auth` / `uploadthing` pattern: install, wire two files, feature works.

**[Live Demo →](https://sniplet.cyguin.com)**

---

## Install

```bash
npm install @cyguin/sniplet
```

## Quick Start

### 1. Create the API route

```ts
// app/api/snips/[...sniplet]/route.ts
import { createSnipletHandler } from '@cyguin/sniplet/next'
import { SQLiteAdapter } from '@cyguin/sniplet/adapters/sqlite'

const adapter = new SQLiteAdapter(
  process.env.SNIPLET_DB_PATH ?? './sniplets.db'
)

const handler = createSnipletHandler({ adapter })

export const GET  = handler
export const POST = handler
export const DELETE = handler
```

### 2. Set the env var

```bash
SNIPLET_DB_PATH=./sniplets.db
```

### 3. Start sharing

```bash
npm run dev
# Visit http://localhost:3000/api/snips
```

---

## API

### POST /api/snips

Create a new snip.

**Request body:**

```json
{
  "content": "console.log('hello')",
  "language": "javascript",
  "expiry": "24h",
  "burnOnRead": true
}
```

| Field | Type | Description |
|---|---|---|
| `content` | `string` | Required. The snippet content. |
| `language` | `string` | Optional. Language hint for syntax highlighting (e.g. `typescript`, `python`). |
| `expiry` | `1h \| 24h \| 7d \| never` | Optional. Default: `7d`. |
| `burnOnRead` | `boolean` | Optional. If true, the snip is deleted after first read. |

**Response (201):**

```json
{
  "id": "V1StGXR8_Z5jdHi6",
  "url": "/api/snips/V1StGXR8_Z5jdHi6"
}
```

### GET /api/snips/:id

Retrieve a snip. Returns the full `Snip` object on success, `410 Gone` for burned or expired snips, `404 Not Found` if missing.

### DELETE /api/snips/:id

Delete a snip. Returns `204 No Content` on success.

---

## Adapters

### SQLiteAdapter (default)

```ts
import { SQLiteAdapter } from '@cyguin/sniplet/adapters/sqlite'
const adapter = new SQLiteAdapter('./sniplets.db')
```

Uses `better-sqlite3`. Runs WAL mode, idempotent migration on first call.

### PostgresAdapter

```ts
import { PostgresAdapter } from '@cyguin/sniplet/adapters/postgres'
const adapter = new PostgresAdapter(process.env.DATABASE_URL)
```

Uses `porsager/postgres`. Atomic burn-on-read via `UPDATE ... RETURNING`.

---

## Handler Options

```ts
createSnipletHandler({
  adapter,
  options: {
    maxLength: 100_000,      // max content bytes (default: 100_000)
    defaultExpiry: '7d',    // default expiry (default: '7d')
    rateLimit: {
      window: '1m',
      max: 30,
    },
  },
})
```

---

## Exports

| Export | Path | Description |
|---|---|---|
| `Snip` | `@cyguin/sniplet` | Stored snippet type |
| `CreateSnipInput` | `@cyguin/sniplet` | Input for creating a snip |
| `SnipletAdapter` | `@cyguin/sniplet` | Interface for custom adapters |
| `SnipletError` | `@cyguin/sniplet` | Base error class |
| `SnipNotFoundError` | `@cyguin/sniplet` | Maps to HTTP 404 |
| `SnipAlreadyBurnedError` | `@cyguin/sniplet` | Maps to HTTP 410 |
| `SnipExpiredError` | `@cyguin/sniplet` | Maps to HTTP 410 |
| `createSnipletHandler` | `@cyguin/sniplet/next` | Next.js route handler factory |
| `SQLiteAdapter` | `@cyguin/sniplet/adapters/sqlite` | SQLite storage adapter |
| `PostgresAdapter` | `@cyguin/sniplet/adapters/postgres` | Postgres storage adapter |

---

## React Components

The `react` export (`@cyguin/sniplet/react`) provides `<SnipCreate>` and `<SnipView>` components with Shiki syntax highlighting. See [the docs](https://sniplet.cyguin.com/docs) for usage.

---

## License

MIT
