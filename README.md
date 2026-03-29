# @cyguin/sniplet

Drop-in snippet sharing for your Next.js app.

[![npm version](https://img.shields.io/npm/v/@cyguin/sniplet)](https://npmjs.com/package/@cyguin/sniplet)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue.svg)](https://www.typescriptlang.org/)

[**Live Demo →**](https://sniplet-sand.vercel.app)

---

## What is this?

Every project needs a way to share snippets. Most developers either rebuild it from scratch every time or bolt on an external service that stores their data somewhere else.

`@cyguin/sniplet` drops into your existing Next.js app in under 10 minutes. No external service, no separate deployment — just a SQLite file or Postgres table you already own, and a URL your users can share.

---

## Quickstart

```bash
npx @cyguin/sniplet init
```

Then start your dev server and visit `/snips`. That's it.

---

## Manual Setup

Three files. No magic.

**`app/api/snips/[...sniplet]/route.ts`** — the API route:

```typescript
import { createSnipletHandler } from '@cyguin/sniplet/next'
import { SQLiteAdapter } from '@cyguin/sniplet/adapters/sqlite'

const adapter = new SQLiteAdapter(process.env.SNIPLET_DB_PATH ?? './data/sniplet.db')
const handler = createSnipletHandler({ adapter })

export { handler as GET, handler as POST, handler as DELETE }

// To use Postgres instead:
// import { PostgresAdapter } from '@cyguin/sniplet/adapters/postgres'
// const adapter = new PostgresAdapter(process.env.DATABASE_URL!)
```

**`app/snips/page.tsx`** — the create page:

```typescript
'use client'
import { SnipCreate } from '@cyguin/sniplet/react'
import { useRouter } from 'next/navigation'

export default function SnipsPage() {
  const router = useRouter()
  return (
    <main style={{ maxWidth: '640px', margin: '0 auto', padding: '2rem 1rem' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>
        Share a Snippet
      </h1>
      <SnipCreate
        onSuccess={(id) => router.push(`/snips/${id}`)}
        variant="tailwind"
      />
    </main>
  )
}
```

**`app/snips/[id]/page.tsx`** — the view page:

```typescript
'use client'
import { SnipView } from '@cyguin/sniplet/react'
import { use } from 'react'

export default function SnipPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  return (
    <main style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem' }}>
      <SnipView id={id} variant="tailwind" />
    </main>
  )
}
```

Add `SNIPLET_DB_PATH=./data/sniplet.db` to your `.env` and create the `data/` directory.

---

## Storage Adapters

**SQLite** — the default, zero-config for most projects:

```typescript
import { SQLiteAdapter } from '@cyguin/sniplet/adapters/sqlite'

new SQLiteAdapter()                              // uses ./data/sniplet.db
new SQLiteAdapter({ path: './custom/path.db' }) // custom path
```

**Postgres** — for apps already running Postgres:

```typescript
import { PostgresAdapter } from '@cyguin/sniplet/adapters/postgres'

new PostgresAdapter({ connectionString: process.env.DATABASE_URL })
```

---

## Configuration

```typescript
createSnipletHandler({
  adapter,
  options: {
    maxLength: 100_000,     // max content length in bytes (default: 100_000)
    defaultExpiry: '7d',   // default expiry when not specified (default: '7d')
    allowAnonymous: true,   // allow anonymous creates (default: true)
    rateLimit: {            // rate limit per IP (default: none)
      window: '1m',         // time window (e.g. '1m', '1h')
      max: 30,              // max requests per window
    },
  },
})
```

---

## React Components

```typescript
import { SnipCreate, SnipView } from '@cyguin/sniplet/react'

// Create a snip
<SnipCreate
  apiBase="/api/snips"          // defaults to /api/snips
  onSuccess={(id, url) => {}}  // called after successful creation
  variant="tailwind"             // 'base' (unstyled) or 'tailwind'
  className="my-class"          // forwarded to root element
/>

// View a snip
<SnipView
  id="V1StGXR8_Z5jdHi"         // required: the snip ID
  apiBase="/api/snips"           // defaults to /api/snips
  variant="tailwind"            // 'base' (unstyled) or 'tailwind'
  className="my-class"          // forwarded to root element
/>
```

`SnipCreate` renders a form with content textarea, language input, expiry selector, and burn-on-read toggle. `SnipView` fetches the snip, renders shiki-highlighted code with a live expiry countdown, and shows clear 404/410 error states.

---

## Exports

| Import | What you get |
|--------|-------------|
| `@cyguin/sniplet` | `Snip`, `CreateSnipInput`, `SnipletAdapter`, `SnipletError` subclasses |
| `@cyguin/sniplet/next` | `createSnipletHandler`, `SnipletConfig`, `SnipletOptions`, `ExpiryOption` |
| `@cyguin/sniplet/react` | `SnipCreate`, `SnipView` |
| `@cyguin/sniplet/adapters/sqlite` | `SQLiteAdapter` |
| `@cyguin/sniplet/adapters/postgres` | `PostgresAdapter` |

---

## Requirements

- **Next.js** 14+ (App Router)
- **Node.js** 20+
- **React** 18+

---

## License

MIT — see [LICENSE](LICENSE)
