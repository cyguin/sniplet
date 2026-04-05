# @cyguin/flag - Reference Research

Research for building a drop-in feature flag package for Next.js.

---

## 1. Existing Feature Flag NPM Packages

### `flag` Package (garbles/flag)
- **npm**: https://www.npmjs.com/package/flag
- **Concept**: Type-safe feature flags with React bindings
- **Pattern**: Uses `createFlags<T>()` to generate typed hooks/components
- **Backends**: StaticBackend, ComputedBackend, AlwaysBackend, NullBackend
- **Note**: Last updated 4 years ago, but excellent pattern for typed API

```typescript
// Creates typed bindings for flags
const { FlagBackendProvider, Flag, useFlag } = createFlags<MyFlags>();
```

### GrowthBook SDKs
- **npm**: `@growthbook/growthbook-react`, `@growthbook/growthbook`
- **Docs**: https://docs.growthbook.io/lib/react
- **Pattern**: Provides both server and client evaluation
- **Key features**:
  - Server-side hydration (pass payload from server to client)
  - Streaming updates via SSE
  - Sticky bucketing
  - Remote evaluation for security

---

## 2. Open Source Reference Implementations

### GrowthBook (7.6k stars)
- **GitHub**: https://github.com/growthbook/growthbook
- **Architecture**:
  - Server SDKs evaluate locally with cached features
  - Client SDKs can use remote evaluation or hydrated payload
  - Supports 24+ language SDKs
- **React Pattern**: Uses `GrowthBookProvider` with context
- **Hashing**: Uses MurmurHash3 for consistent bucketing
- **Schema**: Features stored in JSON with targeting rules

### Unleash (13.3k stars)
- **GitHub**: https://github.com/Unleash/unleash
- **Architecture**:
  - Full self-hosted platform with UI dashboard
  - SDKs connect to Unleash API
  - Supports activation strategies (IP, user agents, etc.)
- **Database**: PostgreSQL primary storage
- **Note**: More complex than needed - overkill for simple drop-in flags

---

## 3. Next.js Dual Evaluation Patterns

### GrowthBook Next.js Pattern (Recommended Reference)

**Server-side (React Server Components)**:
```typescript
import { GrowthBook } from "@growthbook/growthbook";

export default async function MyServerPage() {
  const gb = new GrowthBook({
    apiHost: process.env.GB_API_HOST,
    clientKey: process.env.GB_CLIENT_KEY,
  });
  
  await gb.init({ timeout: 1000 });
  gb.setAttributes({ id: user.id });
  
  const showFeature = gb.isOn("my-feature");
  const trackingData = gb.getDeferredTrackingCalls();
  
  const payload = gb.getDecryptedPayload();
  gb.destroy();
  
  return (
    <div>
      <GrowthBookWrapper payload={payload}>
        <ClientComponent />
      </GrowthBookWrapper>
      <TrackingComponent data={trackingData} />
    </div>
  );
}
```

**Client-side**:
```typescript
"use client";
import { GrowthBookProvider, useFeatureIsOn } from "@growthbook/growthbook-react";

export default function Wrapper({ children, payload }) {
  const gb = useMemo(() => 
    new GrowthBook({
      payload,
      // ...config
    }).initSync({ payload }), [payload]);
    
  return <GrowthBookProvider growthbook={gb}>{children}</GrowthBookProvider>;
}
```

### Key Insight
- Server evaluates and passes `payload` to client
- Client uses `initSync` for synchronous hydration (no flicker)
- Same evaluation logic on both sides

---

## 4. React Context Pattern for Feature Flags

### The `flag` Package Pattern
```typescript
// Create typed bindings
export const { FlagBackendProvider, Flag, useFlag } = createFlags<MyFlags>();

// Provider usage
<FlagBackendProvider backend={backend}>
  <App />
</FlagBackendProvider>

// Usage in components
const isEnabled = useFlag("features.myFeature", false);
const value = useFlag("config.apiUrl", "https://default.com");

// Conditional rendering
<Flag name="features.newUI" render={() => <NewUI />} fallback={() => <OldUI />} />
```

### GrowthBook React Pattern
```typescript
// Provider setup
<GrowthBookProvider growthbook={gb}>
  <MyApp />
</GrowthBookProvider>

// Hooks
const isOn = useFeatureIsOn("feature-name");
const value = useFeatureValue("feature-name", defaultValue);

// Wrapper component
<IfFeatureEnabled feature="feature-name">
  <p>Feature is enabled!</p>
</IfFeatureEnabled>
```

### Implementation Pattern for @cyguin/flag

```typescript
// Context for client-side evaluation
const FlagContext = createContext<{
  flags: Map<string, Flag>;
  isEnabled: (name: string, context?: { userId?: string }) => boolean;
} | null>(null);

// Provider component
export function FlagProvider({ children, initialFlags }) {
  const flags = useMemo(() => new Map(initialFlags), [initialFlags]);
  
  const isEnabled = useCallback((name: string, ctx?: { userId?: string }) => {
    const flag = flags.get(name);
    return evaluateFlag(flag, ctx);
  }, [flags]);
  
  return (
    <FlagContext.Provider value={{ flags, isEnabled }}>
      {children}
    </FlagContext.Provider>
  );
}

// Hook
export function useFlag(name: string) {
  const { isEnabled } = useContext(FlagContext);
  return { enabled: isEnabled(name) };
}

// Conditional component
export function Flag({ name, children, fallback = null }) {
  const { enabled } = useFlag(name);
  return enabled ? children : fallback;
}
```

---

## 5. Percentage Rollout Pattern

### Consistent Hashing Algorithm

The industry standard (used by GrowthBook, LaunchDarkly, etc.):

```typescript
// MurmurHash3 for consistent bucketing
function hash(key: string, seed: number = 0): number {
  // Simplified - use actual murmurhash3 implementation
  let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
  // ...murmur3 algorithm
  return Math.abs(h1);
}

export function inRollout(key: string, percentage: number): boolean {
  if (percentage >= 100) return true;
  if (percentage <= 0) return false;
  
  const hashValue = hash(key);
  const bucket = hashValue % 100;
  return bucket < percentage;
}
```

### User Targeting + Rollout Priority

```typescript
function evaluateFlag(flag: Flag, context: { userId?: string }): boolean {
  // Priority 1: Explicit user targeting (always wins)
  if (flag.userIds && flag.userIds.length > 0) {
    if (context?.userId && flag.userIds.includes(context.userId)) {
      return true;
    }
  }
  
  // Priority 2: Enabled check
  if (!flag.enabled) return false;
  
  // Priority 3: Percentage rollout
  if (flag.rolloutPercentage < 100) {
    if (!context?.userId) return false; // Can't hash without userId
    return inRollout(context.userId, flag.rolloutPercentage);
  }
  
  return true;
}
```

---

## 6. Drizzle ORM Dual Adapter Pattern

### SQLite (libSQL/Turso)
```typescript
import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';

const client = createClient({
  url: process.env.DATABASE_URL,
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

export const db = drizzle(client);
```

### PostgreSQL
```typescript
import { drizzle } from 'drizzle-orm/postgres-js';
import { Client } from 'pg';

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

await client.connect();

export const db = drizzle(client);
```

### Dual Adapter Strategy for @cyguin/flag

```typescript
// adapter.ts - Environment-driven adapter selection
import { drizzle } from 'drizzle-orm/libsql';
import { drizzle as drizzlePg } from 'drizzle-orm/postgres-js';

function createDb() {
  const adapter = process.env.FLAG_DB_ADAPTER || 'sqlite';
  
  if (adapter === 'postgres') {
    const { Client } = require('pg');
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    return drizzlePg(client);
  }
  
  // Default: SQLite/libSQL
  const { createClient } = require('@libsql/client');
  const client = createClient({ url: process.env.DATABASE_URL });
  return drizzle(client);
}

export const db = createDb();
```

### Schema (works for both)
```typescript
// schema.ts - Using Drizzle's portable types
import { sqliteTable, pgTable, text, integer, timestamp } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// For SQLite
export const flags = sqliteTable('flags', {
  name: text('name').primaryKey(),
  enabled: integer('enabled', { mode: 'boolean' }).default(false),
  rolloutPercentage: integer('rollout_percentage').default(100),
  userIds: text('user_ids'), // JSON string
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

// Type for both
export type Flag = typeof flags.$inferSelect;
export type NewFlag = typeof flags.$inferInsert;
```

---

## 7. Summary of Key References

| Area | Reference | Key Pattern |
|------|-----------|-------------|
| Typed Flags API | `flag` npm package | `createFlags<T>()` generates typed hooks |
| React + SSR | GrowthBook | Server hydrates, client uses payload |
| Context Pattern | GrowthBook/flag | `GrowthBookProvider` wrapping app |
| Percentage Rollout | GrowthBook/Unleash | MurmurHash3 consistent bucketing |
| Dual DB Adapter | Drizzle docs | Environment-driven driver selection |
| Schema | Drizzle | Portable column definitions for both DBs |

---

## 8. Implementation Recommendations

1. **Start simple**: Boolean flags with in-code defaults, DB overrides
2. **Use Drizzle's portable schema**: Same types for SQLite and Postgres
3. **Follow GrowthBook's SSR pattern**: Server evaluates → passes payload → client hydrates
4. **Hash function**: Use MurmurHash3 for consistent percentage rollouts
5. **Type safety**: Create TypeScript generics for flag definitions
6. **Environment adapter**: `FLAG_DB_ADAPTER=sqlite|postgres` drives DB selection