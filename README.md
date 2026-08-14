> **This package is no longer actively maintained.** cyguin has narrowed focus to security research (PSCryptoPatterns, PSCertPatterns, PSCMSPatterns). Existing published versions remain on npm and MIT-licensed, but no further releases are planned. See cyguin.com for current work.

# @cyguin/sniplet

Pastebin for code. Drop-in, no account required, self-hosted on your own database.

```bash
npm install @cyguin/sniplet
```

Share snippets via URL with burn-on-read, expiry, and syntax highlighting. You own the data — it lives in your database, not on some third-party server.

## Quick Start

**1. Install**

```bash
npm install @cyguin/sniplet
```

**2. Add the route** — `app/api/snips/[...cyguin]/route.ts`:

```typescript
import { createSnipletHandler } from '@cyguin/sniplet/next'
import { SQLiteAdapter } from '@cyguin/sniplet/adapters/sqlite'

const handler = createSnipletHandler({
  adapter: SQLiteAdapter({ path: './data/sniplet.db' }),
})

export async function GET(req: Request, { params }: { params: Promise<{ cyguin: string[] }> }) {
  return handler(req, params as any)
}
export async function POST(req: Request, { params }: { params: Promise<{ cyguin: string[] }> }) {
  return handler(req, params as any)
}
export async function DELETE(req: Request, { params }: { params: Promise<{ cyguin: string[] }> }) {
  return handler(req, params as any)
}
```

**3. Drop in the components:**

```tsx
// app/snips/create/page.tsx
'use client'
import { SnipCreate } from '@cyguin/sniplet/react'

export default function CreatePage() {
  return (
    <SnipCreate
      apiBase="/api/snips"
      onSuccess={(id, url) => {
        navigator.clipboard.writeText(url)
        window.location.href = `/snips/${id}`
      }}
      theme="dark"
    />
  )
}
```

```tsx
// app/snips/[id]/page.tsx
'use client'
import { SnipView } from '@cyguin/sniplet/react'

export default function SnipPage({ params }: { params: { id: string } }) {
  return <SnipView id={params.id} apiBase="/api/snips" theme="dark" />
}
```

## API Routes

| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/api/snips/[...cyguin]` | Get a snip by ID |
| `GET` | `/api/snips/options` | List expiry options |
| `POST` | `/api/snips` | Create a new snip |
| `DELETE` | `/api/snips/[...cyguin]` | Delete a snip |

## Theming

Components default to the cyguin dark palette. Set `--cyguin-*` variables on a parent or `:root`:

```css
:root {
  --cyguin-bg: #0a0d17;
  --cyguin-bg-subtle: #101521;
  --cyguin-border: #252b3a;
  --cyguin-fg: #f1f3f6;
  --cyguin-fg-muted: #888888;
  --cyguin-accent: #f5a800;
  --cyguin-accent-dark: #c47f00;
  --cyguin-accent-fg: #0a0a0a;
  --cyguin-radius: 6px;
  --cyguin-shadow: 0 1px 4px rgba(0,0,0,0.08);
}
```

For a light interface, pass `theme="light"`:

```tsx
<SnipCreate theme="light" />
<SnipView theme="light" />
```

## Adapters

### SQLite (default)

```typescript
import { SQLiteAdapter } from '@cyguin/sniplet/adapters/sqlite'

createSnipletHandler({
  adapter: SQLiteAdapter({ path: './data/sniplet.db' }),
})
```

### Postgres

```typescript
import { PostgresAdapter } from '@cyguin/sniplet/adapters/postgres'

createSnipletHandler({
  adapter: PostgresAdapter({ connectionString: process.env.DATABASE_URL! }),
})
```

## Exports

| Import | What you get |
|--------|-------------|
| `@cyguin/sniplet` | Types: `Snip`, `CreateSnipInput`, `SnipletAdapter`, error classes |
| `@cyguin/sniplet/next` | `createSnipletHandler`, `SnipletConfig`, `SnipletOptions`, `ExpiryOption` |
| `@cyguin/sniplet/react` | `SnipCreate`, `SnipView` |
| `@cyguin/sniplet/adapters/sqlite` | `SQLiteAdapter` |
| `@cyguin/sniplet/adapters/postgres` | `PostgresAdapter` |

## Requirements

- Next.js 14+ (App Router)
- React 18+
- Node.js 20+

## License

MIT
