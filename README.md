# @cyguin/sniplet

**Pastebin for code.** Drop-in snippet sharing for Next.js apps.

```
npm install @cyguin/sniplet
```

Share code snippets via URL — burn-on-read, expiry, syntax highlighting. No account required. Self-hosted on your own database.

---

## Quick Start

**1. Install**

```bash
npm install @cyguin/sniplet
```

**2. Add the route** — `app/api/snips/[...cyguin]/route.ts`:

```typescript
import { createSnipletHandler } from '@cyguin/sniplet/next'
import { SQLiteAdapter } from '@cyguin/sniplet/adapters/sqlite'

(globalThis as any).__SNIPLET_CONFIG__ = createSnipletHandler({
  adapter: SQLiteAdapter({ path: './data/sniplet.db' }),
  options: {
    defaultExpiry: '7d',
    rateLimit: { window: '1m', max: 30 },
  },
})

export { handler as GET, handler as POST, handler as DELETE } from '@cyguin/sniplet/next'
```

Wait — the `handler` export doesn't exist yet. The real pattern in Next.js App Router is:

```typescript
// app/api/snips/[...cyguin]/route.ts
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
      theme="light"
    />
  )
}
```

```tsx
// app/snips/[id]/page.tsx
'use client'
import { SnipView } from '@cyguin/sniplet/react'

export default function SnipPage({ params }: { params: { id: string } }) {
  return <SnipView id={params.id} apiBase="/api/snips" theme="light" />
}
```

---

## API Routes

| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/api/snips/[...cyguin]` | Get a snip by ID |
| `GET` | `/api/snips/options` | List expiry options |
| `POST` | `/api/snips` | Create a new snip |
| `DELETE` | `/api/snips/[...cyguin]` | Delete a snip |

---

## Theming

All components use `--cyguin-*` CSS custom properties. Set them on a parent element or CSS selector:

```css
/* Light (default) */
:root {
  --cyguin-bg: #ffffff;
  --cyguin-bg-subtle: #f5f5f5;
  --cyguin-border: #e5e5e5;
  --cyguin-fg: #0a0a0a;
  --cyguin-fg-muted: #888888;
  --cyguin-accent: #f5a800;
  --cyguin-accent-dark: #c47f00;
  --cyguin-accent-fg: #0a0a0a;
  --cyguin-radius: 6px;
  --cyguin-shadow: 0 1px 4px rgba(0,0,0,0.08);
}

/* Dark (cyguin) */
[data-theme="dark"] {
  --cyguin-bg: #0a0a0a;
  --cyguin-bg-subtle: #1a1a1a;
  --cyguin-border: #2a2a2a;
  --cyguin-fg: #f5f5f5;
  --cyguin-shadow: 0 1px 4px rgba(0,0,0,0.4);
}
```

Or pass `theme="dark"` prop:

```tsx
<SnipCreate theme="dark" />
<SnipView theme="dark" />
```

---

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

---

## Exports

| Import | What you get |
|--------|-------------|
| `@cyguin/sniplet` | Types: `Snip`, `CreateSnipInput`, `SnipletAdapter`, error classes |
| `@cyguin/sniplet/next` | `createSnipletHandler`, `SnipletConfig`, `SnipletOptions`, `ExpiryOption` |
| `@cyguin/sniplet/react` | `SnipCreate`, `SnipView` |
| `@cyguin/sniplet/adapters/sqlite` | `SQLiteAdapter` |
| `@cyguin/sniplet/adapters/postgres` | `PostgresAdapter` |

---

## Requirements

- Next.js 14+ (App Router)
- React 18+
- Node.js 20+

---

## License

MIT
