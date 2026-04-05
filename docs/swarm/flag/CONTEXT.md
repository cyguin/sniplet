# Context: @cyguin/flag

## Project Info
- Package: @cyguin/flag
- Type: Feature flags for Next.js

## Spec Summary
- Boolean flags, percentage rollouts, user targeting
- In-code + DB defined flags
- Server + client evaluation
- Environment-driven adapter

## Research Complete ✓

### Key References
- GrowthBook: Server hydration pattern for SSR
- Drizzle: Dual SQLite/Postgres adapter pattern
- MurmurHash3: Consistent percentage bucketing

### Libraries to Use
- drizzle-orm, @libsql/client (SQLite)
- drizzle-orm, pg (PostgreSQL)
- @flag/npm or custom Context pattern

### Implementation Approach
1. Drizzle schema with portable types (SQLite + Postgres)
2. Environment-driven adapter: `FLAG_DB_ADAPTER`
3. Server evaluation → client hydration (prevent flicker)
4. MurmurHash3 for percentage rollouts
5. React Context + hooks for client-side

### DB Schema
```typescript
flags table:
- name: string (PK)
- enabled: boolean (default false)
- rolloutPercentage: number (0-100)
- userIds: string[] (JSON)
- createdAt, updatedAt: timestamps
```

### API Surface
- isEnabled(flagName, context?)
- getAllFlags()
- setFlag(name, config)
- deleteFlag(name)
- <FlagProvider>
- <Flag name>
- useFlag(name)