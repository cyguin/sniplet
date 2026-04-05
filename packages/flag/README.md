# @cyguin/flag

Drop-in feature flags for Next.js with database-backed rollouts and percentage rollouts.

## Features

- **Boolean flags**: Simple on/off toggles
- **Percentage rollouts**: Gradual rollout by user ID hash
- **User targeting**: Specific users always get a flag
- **Server-side evaluation**: Works in Server Components, API Routes, Middleware
- **Client-side evaluation**: React Context provider, hooks, and components
- **Hybrid**: In-code defaults with database overrides

## Installation

```bash
npm install @cyguin/flag
```

## Quick Start

### 1. Server-Side Usage

Evaluate flags in Server Components or API routes:

```typescript
import { isEnabled, getAllFlags } from '@cyguin/flag'

// In a Server Component
export default async function Page() {
  const showNewFeature = await isEnabled('new-feature')
  
  if (showNewFeature) {
    return <NewFeature />
  }
  return <OldFeature />
}
```

### 2. Client-Side Usage

Wrap your app with the FlagProvider and use the Flag component or useFlag hook:

```typescript
import { FlagProvider, Flag, useFlag } from '@cyguin/flag'

// In your providers/layout
export function Providers({ children }) {
  return (
    <FlagProvider initialFlags={[]}>
      {children}
    </FlagProvider>
  )
}

// Using the Flag component
export function MyComponent() {
  return (
    <Flag name="new-feature" fallback={<OldFeature />}>
      <NewFeature />
    </Flag>
  )
}

// Using the useFlag hook
export function MyOtherComponent() {
  const { enabled } = useFlag('new-feature')
  
  return enabled ? <NewFeature /> : <OldFeature />
}
```

### 3. Database Setup

Set up your database using Drizzle. The package supports both SQLite (libSQL/Turso) and PostgreSQL:

```typescript
// Environment variable to choose adapter
// FLAG_DB_ADAPTER=sqlite (default)
// FLAG_DB_ADAPTER=postgresql

// For SQLite/Turso
TURSO_DB_URL=file:local.db
TURSO_DB_AUTH_TOKEN=your-token

// For PostgreSQL
DATABASE_URL=postgresql://user:pass@localhost:5432/db
```

### 4. API Routes

The package includes API routes for CRUD operations:

```typescript
// GET /api/flags - List all flags
// POST /api/flags - Create/update a flag
// DELETE /api/flags?name=flag-name - Delete a flag
```

## Flag Types

### Boolean Flags

Simple on/off toggles:

```typescript
{
  name: 'dark-mode',
  enabled: true,
  rolloutPercentage: 100,
  userIds: []
}
```

### Percentage Rollouts

Gradually enable features for a percentage of users:

```typescript
{
  name: 'new-checkout',
  enabled: false,
  rolloutPercentage: 25, // 25% of users
  userIds: []
}
```

The rollout uses MurmurHash3 to consistently bucket users by their userId.

### User Targeting

Always enable a flag for specific users:

```typescript
{
  name: 'beta-feature',
  enabled: false,
  rolloutPercentage: 0,
  userIds: ['user-123', 'user-456'] // These users always get the flag
}
```

## API Reference

### Server Functions

```typescript
// Check if a flag is enabled
isEnabled(flagName: string, context?: { userId?: string }): Promise<boolean>

// Get all flags
getAllFlags(): Promise<Flag[]>

// Get a single flag
getFlag(name: string): Promise<Flag | null>

// Set a flag (admin)
setFlag(name: string, config: FlagConfig): Promise<void>

// Delete a flag (admin)
deleteFlag(name: string): Promise<void>
```

### React Components

```typescript
// Provider
<FlagProvider 
  initialFlags={[]}        // Initial flags from server
  pollingInterval={0}      // Optional polling interval in ms
  apiEndpoint="/api/flags" // API endpoint to fetch flags
>
  {children}
</FlagProvider>

// Conditional rendering
<Flag 
  name="feature-name"
  fallback={<Fallback />}  // Rendered when disabled
  loading={<Loading />}    // Rendered while loading
>
  <FeatureComponent />
</Flag>
```

### Hooks

```typescript
const { enabled, isLoading, refresh } = useFlag('feature-name', {
  defaultValue: false  // Default when flag doesn't exist
})
```

## Types

```typescript
interface Flag {
  name: string
  enabled: boolean
  rolloutPercentage: number
  userIds: string[]
  createdAt?: string
  updatedAt?: string
}

interface FlagConfig {
  enabled?: boolean
  rolloutPercentage?: number
  userIds?: string[]
}

interface FlagEvaluationContext {
  userId?: string
}
```

## Example App

See `examples/simple` for a complete Next.js example demonstrating:

- Server-side flag evaluation in Server Components
- Client-side evaluation using Flag component and useFlag hook
- FlagProvider setup with initial flags

```bash
cd examples/simple
npm install
npm run dev
```

## License

MIT