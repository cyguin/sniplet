# @cyguin/flag - Feature Flags

## Brief
A drop-in feature flag package for Next.js apps that supports both in-code and database-defined flags with percentage rollouts, evaluable on both client and server.

## Problem
LaunchDarkly costs $10k+/year. Unleash is complex to self-host. There's no zero-config, DB-backed feature flag primitive for Next.js App Router that follows the drop-in pattern.

## Target Users
Indie Next.js builders who need simple feature flags without expensive third-party services.

## Core Features

### 1. Flag Types
- **Boolean flags**: Simple on/off toggles
- **Percentage rollouts**: Gradual rollout by user ID hash
- **User targeting**: Specific users always get a flag

### 2. Flag Sources
- **In-code flags**: Defined in TypeScript, good for permanent features
- **Database flags**: Dynamic, can be changed without deploy
- **Hybrid**: In-code defaults, DB overrides

### 3. Evaluation Contexts
- **Server-side**: Server Components, API routes, Middleware
- **Client-side**: React Context provider, hooks
- Both use same underlying flag evaluation logic

### 4. Database Schema
```typescript
flags table:
- name: string (primary key)
- enabled: boolean (default false)
- rolloutPercentage: number (0-100, default 100)
- userIds: string[] (JSON array of user IDs)
- createdAt: timestamp
- updatedAt: timestamp
```

### 5. Adapter Pattern
- SQLite via libSQL (Drizzle)
- PostgreSQL via pg (Drizzle)
- Environment-driven: `process.env.FLAG_DB_ADAPTER`

## API Surface

### Server Functions
```typescript
// Check if flag is enabled for a user
isEnabled(flagName: string, context?: { userId?: string }): boolean

// List all flags
getAllFlags(): Flag[]

// Create/update flag (admin)
setFlag(name: string, config: FlagConfig): void

// Delete flag (admin)
deleteFlag(name: string): void
```

### React Components
```typescript
// Client-side context provider
<FlagProvider>
  {children}
</FlagProvider>

// Conditional rendering based on flag
<Flag name="feature-name">
  <FeatureComponent />
</Flag>

// Hook for more control
const { enabled } = useFlag('feature-name')
```

### Types
```typescript
interface Flag {
  name: string
  enabled: boolean
  rolloutPercentage: number
  userIds: string[]
}

interface FlagConfig {
  enabled?: boolean
  rolloutPercentage?: number
  userIds?: string[]
}
```

## Tech Stack
- Framework: Next.js App Router
- Language: TypeScript
- DB: Drizzle ORM with adapter pattern (SQLite/libSQL, Postgres/pg)
- UI: React with Context + hooks

## Acceptance Criteria
- [x] Boolean flags work (on/off)
- [x] Percentage rollouts work with consistent hash
- [x] User targeting works (specific users always get flag)
- [x] In-code flags supported
- [x] Database flags supported
- [x] Server-side evaluation works
- [x] Client-side evaluation works
- [x] Environment-driven adapter selection
- [x] Package builds successfully
- [x] Has working example app

## Priority
Essential: Boolean flags, DB storage, server evaluation
Important: Percentage rollouts, client evaluation, in-code flags
Nice-to-have: Admin dashboard (for hosted tier)

## Hosted Tier Potential
High - founders want dashboard to flip flags without deploy. Natural complement to @cyguin/changelog (ship feature → flip flag → publish changelog).