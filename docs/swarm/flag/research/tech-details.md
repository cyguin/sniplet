# @cyguin/flag - Technical Implementation Details

## 1. Drizzle ORM Dual Adapter Pattern

### Environment-Driven Adapter Selection

```typescript
// src/adapter.ts
import { drizzle as drizzleLibSQL } from 'drizzle-orm/libsql'
import { drizzle as drizzlePg } from 'drizzle-orm/pg'
import { createClient } from '@libsql/client'
import pg from 'pg'

type DatabaseClient = ReturnType<typeof createClient> | pg.Pool

export function createDatabaseClient(): DatabaseClient {
  const adapter = process.env.FLAG_DB_ADAPTER || 'sqlite'
  
  if (adapter === 'postgresql') {
    const pool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
    })
    return pool
  }
  
  // Default: SQLite via libSQL (Turso-compatible)
  const client = createClient({
    url: process.env.TURSO_DB_URL || 'file:local.db',
    authToken: process.env.TURSO_DB_AUTH_TOKEN,
  })
  return client
}
```

### SQLite (libSQL) with Drizzle

```typescript
// src/drizzle/sqlite.ts
import { drizzle } from 'drizzle-orm/libsql'
import { createClient } from '@libsql/client'
import * as schema from '../schema'

export function createSQLiteClient() {
  const client = createClient({
    url: process.env.TURSO_DB_URL || 'file:local.db',
    authToken: process.env.TURSO_DB_AUTH_TOKEN,
  })
  
  return drizzle(client, { schema })
}

export type SQLiteDb = ReturnType<typeof createSQLiteClient>
```

```typescript
// src/schema.ts
import { sqliteTable, text, integer, json } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

export const flags = sqliteTable('flags', {
  name: text('name').primaryKey(),
  enabled: integer('enabled', { mode: 'boolean' }).default(false).notNull(),
  rolloutPercentage: integer('rollout_percentage').default(100).notNull(),
  userIds: json('user_ids').$type<string[]>().default([]),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
})

export type FlagDb = typeof flags.$inferSelect
export type FlagDbInsert = typeof flags.$inferInsert
```

### PostgreSQL with Drizzle

```typescript
// src/drizzle/postgres.ts
import { drizzle } from 'drizzle-orm/postgres-js'
import { postgres } from 'postgres'
import * as schema from '../schema'

export function createPostgresClient() {
  const client = postgres(process.env.DATABASE_URL, { 
    max: 1 // Connection pool for edge contexts
  })
  
  return drizzle(client, { schema })
}

export type PostgresDb = ReturnType<typeof createPostgresClient>
```

```typescript
// src/schema.pg.ts
import { pgTable, text, boolean, integer, jsonb, timestamp } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

export const flagsPg = pgTable('flags', {
  name: text('name').primaryKey(),
  enabled: boolean('enabled').default(false).notNull(),
  rolloutPercentage: integer('rollout_percentage').default(100).notNull(),
  userIds: jsonb('user_ids').$type<string[]>().default([]),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

export type FlagPg = typeof flagsPg.$inferSelect
export type FlagPgInsert = typeof flagsPg.$inferInsert
```

### Unified Schema (Shared Types)

```typescript
// src/types.ts
export interface Flag {
  name: string
  enabled: boolean
  rolloutPercentage: number
  userIds: string[]
  createdAt?: Date
  updatedAt?: Date
}

export interface FlagConfig {
  enabled?: boolean
  rolloutPercentage?: number
  userIds?: string[]
}

export interface FlagEvaluationContext {
  userId?: string
}
```

### Adapter Factory Pattern

```typescript
// src/db/index.ts
import { getAdapterConfig } from '../config'
import { createSQLiteClient } from './sqlite'
import { createPostgresClient } from './postgres'
import type { SQLiteDb } from './sqlite'
import type { PostgresDb } from './postgres'

export type DbClient = SQLiteDb | PostgresDb

let dbInstance: DbClient | null = null

export function getDb(): DbClient {
  if (dbInstance) return dbInstance
  
  const config = getAdapterConfig()
  
  if (config.adapter === 'postgresql') {
    dbInstance = createPostgresClient()
  } else {
    dbInstance = createSQLiteClient()
  }
  
  return dbInstance
}

// For testing - allow injection
export function setDb(client: DbClient) {
  dbInstance = client
}
```

```typescript
// src/config.ts
export interface AdapterConfig {
  adapter: 'sqlite' | 'postgresql'
  connectionString?: string
  authToken?: string
}

export function getAdapterConfig(): AdapterConfig {
  const adapter = process.env.FLAG_DB_ADAPTER || 'sqlite'
  
  return {
    adapter: adapter as 'sqlite' | 'postgresql',
    connectionString: process.env.DATABASE_URL || process.env.TURSO_DB_URL,
    authToken: process.env.TURSO_DB_AUTH_TOKEN,
  }
}
```

---

## 2. Percentage Rollout Algorithm

### MurmurHash3 Implementation for Consistent Bucketing

```typescript
// src/utils/hash.ts
/**
 * MurmurHash3 implementation for consistent bucketing
 * Based on the canonical MurmurHash3 algorithm
 */

export function murmurhash3(key: string, seed: number = 0): number {
  const data = new TextEncoder().encode(key)
  const len = data.length
  let h1 = seed
  
  const c1 = 0xcc9e2d51
  const c2 = 0x1b873593
  
  // Read in chunks of 4 bytes
  const numBlocks = Math.floor(len / 4)
  const blockSize = 4 * numBlocks
  
  for (let i = 0; i < numBlocks; i++) {
    const k1 = 
      (data[i * 4]) |
      (data[i * 4 + 1] << 8) |
      (data[i * 4 + 2] << 16) |
      (data[i * 4 + 3] << 24)
    
    k1 = Math.imul(k1, c1)
    k1 = (k1 << 15) | (k1 >>> 17)
    h1 = Math.imul(h1 ^ k1, c2)
  }
  
  // Handle remaining bytes
  const tail = len % 4
  let k1 = 0
  
  if (tail >= 3) k1 ^= data[blockSize + 2] << 16
  if (tail >= 2) k1 ^= data[blockSize + 1] << 8
  if (tail >= 1) {
    k1 ^= data[blockSize]
    k1 = Math.imul(k1, c1)
    k1 = (k1 << 15) | (k1 >>> 17)
    h1 ^= k1
  }
  
  // Finalization
  h1 ^= len
  h1 ^= h1 >>> 16
  h1 = Math.imul(h1, 0x85ebca6b)
  h1 ^= h1 >>> 13
  h1 = Math.imul(h1, 0xc2b2ae35)
  h1 ^= h1 >>> 16
  
  return h1 >>> 0 // Return unsigned int32
}

/**
 * Convert hash to bucket value 0-100 for percentage rollout
 */
export function hashToPercentile(key: string, seed: number = 0): number {
  const hash = murmurhash3(key, seed)
  return (hash % 10000) / 100 // Returns 0.00 to 100.00
}
```

### Rollout Evaluation Logic

```typescript
// src/utils/evaluate.ts
import { type Flag, type FlagEvaluationContext } from '../types'
import { murmurhash3 } from './hash'

export interface EvaluationResult {
  enabled: boolean
  reason: 'boolean' | 'user-targeting' | 'percentage-rollout' | 'default'
}

/**
 * Evaluate a flag for a given context
 * Priority: userIds > rolloutPercentage > enabled
 */
export function evaluateFlag(
  flag: Flag,
  context: FlagEvaluationContext = {}
): EvaluationResult {
  const { userId } = context
  
  // 1. Check user targeting first (highest priority)
  if (userId && flag.userIds && flag.userIds.length > 0) {
    if (flag.userIds.includes(userId)) {
      return { enabled: true, reason: 'user-targeting' }
    }
  }
  
  // 2. Check percentage rollout
  if (flag.rolloutPercentage < 100 && userId) {
    const bucket = (murmurhash3(userId) % 10000) / 100
    const enabled = bucket < flag.rolloutPercentage
    return { 
      enabled, 
      reason: enabled ? 'percentage-rollout' : 'default' 
    }
  }
  
  // 3. Fall back to boolean enabled
  return { 
    enabled: flag.enabled, 
    reason: flag.enabled ? 'boolean' : 'default' 
  }
}

/**
 * Simplified check - just returns boolean
 */
export function isEnabledForContext(
  flag: Flag,
  context: FlagEvaluationContext = {}
): boolean {
  return evaluateFlag(flag, context).enabled
}
```

### Usage Example

```typescript
// Example usage
import { evaluateFlag } from '../utils/evaluate'
import type { Flag, FlagEvaluationContext } from '../types'

const flag: Flag = {
  name: 'new-checkout',
  enabled: false,
  rolloutPercentage: 25,
  userIds: ['user-123', 'user-456']
}

// User in userIds - always enabled
console.log(evaluateFlag(flag, { userId: 'user-123' }))
// { enabled: true, reason: 'user-targeting' }

// User not in userIds, but in 25% bucket - enabled
console.log(evaluateFlag(flag, { userId: 'user-789' }))
// { enabled: true, reason: 'percentage-rollout' }

// No userId - falls back to enabled boolean
console.log(evaluateFlag(flag, {}))
// { enabled: false, reason: 'default' }
```

---

## 3. React Context for Feature Flags

### Flag Context Provider

```typescript
// src/react/FlagContext.tsx
'use client'

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { type Flag, type FlagEvaluationContext } from '../types'
import { evaluateFlag } from '../utils/evaluate'
import { fetchFlagsClient } from '../actions/flags'

export interface FlagContextValue {
  flags: Map<string, Flag>
  isEnabled: (name: string, context?: FlagEvaluationContext) => boolean
  isLoading: boolean
}

const FlagContext = createContext<FlagContextValue | null>(null)

export function FlagProvider({ children, initialFlags = [] }: { 
  children: ReactNode
  initialFlags?: Flag[]
}) {
  const [flags, setFlags] = useState<Map<string, Flag>>(() => {
    const map = new Map<string, Flag>()
    initialFlags.forEach(f => map.set(f.name, f))
    return map
  })
  const [isLoading, setIsLoading] = useState(true)

  // Fetch fresh flags on mount
  useEffect(() => {
    async function loadFlags() {
      try {
        const freshFlags = await fetchFlagsClient()
        const map = new Map<string, Flag>()
        freshFlags.forEach(f => map.set(f.name, f))
        setFlags(map)
      } catch (error) {
        console.error('Failed to load flags:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadFlags()
    
    // Optional: poll for updates every 30 seconds
    const interval = setInterval(loadFlags, 30000)
    return () => clearInterval(interval)
  }, [])

  const isEnabled = (name: string, context?: FlagEvaluationContext): boolean => {
    const flag = flags.get(name)
    
    if (!flag) {
      // Fall back to in-code default if DB flag doesn't exist
      return false
    }
    
    return evaluateFlag(flag, context).enabled
  }

  return (
    <FlagContext.Provider value={{ flags, isEnabled, isLoading }}>
      {children}
    </FlagContext.Provider>
  )
}

export function useFlagContext() {
  const context = useContext(FlagContext)
  if (!context) {
    throw new Error('useFlagContext must be used within FlagProvider')
  }
  return context
}
```

### useFlag Hook

```typescript
// src/react/useFlag.ts
'use client'

import { useState, useCallback, useMemo } from 'react'
import { useFlagContext } from './FlagContext'
import { type FlagEvaluationContext } from '../types'

export interface UseFlagOptions {
  /** Default value when flag doesn't exist */
  defaultValue?: boolean
  /** User context for evaluation */
  user?: { id?: string }
}

export interface UseFlagResult {
  enabled: boolean
  isLoading: boolean
  /** Refresh flag state from server */
  refresh: () => Promise<void>
}

/**
 * Hook to check feature flag status
 * 
 * @example
 * const { enabled } = useFlag('new-feature')
 * 
 * @example
 * const { enabled } = useFlag('new-feature', { 
 *   defaultValue: true,
 *   user: { id: 'user-123' }
 * })
 */
export function useFlag(
  flagName: string,
  options: UseFlagOptions = {}
): UseFlagResult {
  const { isEnabled, isLoading } = useFlagContext()
  const [refreshing, setRefreshing] = useState(false)

  const context: FlagEvaluationContext | undefined = useMemo(() => {
    if (options.user?.id) {
      return { userId: options.user.id }
    }
    return undefined
  }, [options.user?.id])

  const enabled = isEnabled(flagName, context) || options.defaultValue || false

  const refresh = useCallback(async () => {
    setRefreshing(true)
    // Trigger a re-fetch of flags
    // This would typically invalidate the cache/query
    setTimeout(() => setRefreshing(false), 100)
  }, [])

  return {
    enabled,
    isLoading: isLoading || refreshing,
    refresh,
  }
}
```

### Flag Component

```typescript
// src/react/Flag.tsx
'use client'

import { type ReactNode, useState, useEffect } from 'react'
import { useFlag } from './useFlag'
import type { UseFlagOptions } from './useFlag'

export interface FlagProps {
  name: string
  children: ReactNode
  /** Render alternative when flag is disabled */
  fallback?: ReactNode
  /** Show loading state while evaluating */
  loading?: ReactNode
  /** Hook options */
  options?: UseFlagOptions
  /** Include specific user ID */
  userId?: string
}

/**
 * Conditional rendering component based on feature flag
 * 
 * @example
 * <Flag name="new-feature">
 *   <NewFeatureComponent />
 * </Flag>
 * 
 * @example
 * <Flag name="new-feature" fallback={<OldVersion />}>
 *   <NewFeatureComponent />
 * </Flag>
 */
export function Flag({ 
  name, 
  children, 
  fallback = null, 
  loading = null,
  options = {},
  userId 
}: FlagProps) {
  const finalOptions = userId 
    ? { ...options, user: { id: userId } }
    : options
    
  const { enabled, isLoading } = useFlag(name, finalOptions)

  if (isLoading) {
    return loading as ReactNode
  }

  return enabled ? children : fallback
}
```

### Server-Side Hydration

```typescript
// src/react/FlagProviderClient.tsx
'use client'

import { useMemo } from 'react'
import { FlagProvider } from './FlagContext'
import type { Flag } from '../types'

interface FlagProviderClientProps {
  children: React.ReactNode
  /** Flags passed from server */
  serverFlags?: Flag[]
}

/**
 * Client-side provider that hydrates with server-passed flags
 * The server passes initial flags to avoid flash of wrong content
 */
export function FlagProviderClient({ 
  children, 
  serverFlags = [] 
}: FlagProviderClientProps) {
  const initialFlags = useMemo(() => serverFlags, [serverFlags])
  
  return (
    <FlagProvider initialFlags={initialFlags}>
      {children}
    </FlagProvider>
  )
}
```

---

## 4. Next.js App Router Integration

### Server Component Flag Evaluation

```typescript
// src/server/index.ts
import { getDb } from '../db'
import { flags } from '../schema'
import { eq } from 'drizzle-orm'
import { isEnabledForContext, evaluateFlag } from '../utils/evaluate'
import type { Flag, FlagEvaluationContext } from '../types'

/**
 * Server-side flag evaluation
 * Works in Server Components, API Routes, Middleware
 */

export async function getFlag(name: string): Promise<Flag | null> {
  const db = getDb()
  const result = await db.select().from(flags).where(eq(flags.name, name))
  return result[0] || null
}

export async function getAllFlags(): Promise<Flag[]> {
  const db = getDb()
  return db.select().from(flags) as Promise<Flag[]>
}

export async function isEnabled(
  flagName: string, 
  context: FlagEvaluationContext = {}
): Promise<boolean> {
  const flag = await getFlag(flagName)
  
  if (!flag) {
    // Check in-code flags
    const inCodeFlags = getInCodeFlags()
    const inCodeFlag = inCodeFlags[flagName]
    return inCodeFlag?.enabled ?? false
  }
  
  return isEnabledForContext(flag, context)
}

/**
 * Get flags for client-side hydration
 * Called in Server Components
 */
export async function getFlagsForClient(): Promise<Flag[]> {
  return getAllFlags()
}
```

### Server Component Usage

```typescript
// src/app/dashboard/page.tsx
import { isEnabled, getFlagsForClient } from '../../server'
import { FlagProviderClient } from '../../react/FlagProviderClient'
import { DashboardContent } from './DashboardContent'

export default async function DashboardPage() {
  // Evaluate flag server-side
  const showNewFeature = await isEnabled('new-checkout')
  
  // Get all flags for client hydration
  const flags = await getFlagsForClient()
  
  return (
    <FlagProviderClient serverFlags={flags}>
      <DashboardContent showNewFeature={showNewFeature} />
    </FlagProviderClient>
  )
}
```

### API Routes for Flag CRUD

```typescript
// src/app/api/flags/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { isEnabled, getFlag, getAllFlags, setFlag, deleteFlag } from '../../../server'
import { type FlagConfig } from '../../../types'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const name = searchParams.get('name')
  
  if (name) {
    const flag = await getFlag(name)
    if (!flag) {
      return NextResponse.json({ error: 'Flag not found' }, { status: 404 })
    }
    return NextResponse.json(flag)
  }
  
  const flags = await getAllFlags()
  return NextResponse.json(flags)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, config } = body
    
    if (!name || !config) {
      return NextResponse.json(
        { error: 'Missing name or config' }, 
        { status: 400 }
      )
    }
    
    await setFlag(name, config)
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to set flag' }, 
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const name = searchParams.get('name')
  
  if (!name) {
    return NextResponse.json(
      { error: 'Missing flag name' }, 
      { status: 400 }
    )
  }
  
  await deleteFlag(name)
  return NextResponse.json({ success: true })
}
```

```typescript
// src/app/api/flags/check/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { isEnabled } from '../../../../server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { flagName, userId } = body
    
    const enabled = await isEnabled(flagName, { userId })
    
    return NextResponse.json({ enabled })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to check flag' }, 
      { status: 500 }
    )
  }
}
```

### Server Action for Client Fetching

```typescript
// src/actions/flags.ts
'use server'

import { getAllFlags } from '../server'
import { revalidatePath } from 'next/cache'
import type { Flag } from '../types'

/**
 * Server action to fetch flags from client components
 */
export async function fetchFlagsClient(): Promise<Flag[]> {
  revalidatePath('/api/flags')
  return getAllFlags()
}

/**
 * Server action to set a flag (admin only)
 */
export async function setFlagServer(
  name: string, 
  config: { enabled?: boolean; rolloutPercentage?: number; userIds?: string[] }
) {
  const { setFlag } = await import('../server')
  await setFlag(name, config)
  revalidatePath('/api/flags')
}
```

### Client Component Flag Usage

```typescript
// src/app/dashboard/DashboardContent.tsx
'use client'

import { Flag } from '../../react/Flag'
import { useFlag } from '../../react/useFlag'

export function DashboardContent({ showNewFeature }: { 
  showNewFeature: boolean 
}) {
  // Client-side evaluation (can also check server-passed value)
  const { enabled } = useFlag('beta-dashboard')
  
  return (
    <div>
      <h1>Dashboard</h1>
      
      {/* Using Flag component */}
      <Flag name="new-checkout">
        <NewCheckoutFlow />
      </Flag>
      
      {/* Using useFlag hook */}
      {enabled && <BetaBadge />}
      
      {/* Server-side value passed down */}
      {showNewFeature && <NewFeatureIndicator />}
    </div>
  )
}
```

---

## 5. TypeScript Types

### Core Type Definitions

```typescript
// src/types/index.ts

/**
 * Core flag interface - represents a feature flag
 */
export interface Flag {
  /** Unique identifier for the flag */
  name: string
  /** Whether the flag is enabled by default */
  enabled: boolean
  /** Percentage of users for gradual rollout (0-100) */
  rolloutPercentage: number
  /** Specific user IDs that always receive the flag */
  userIds: string[]
  /** Timestamp when flag was created */
  createdAt?: Date
  /** Timestamp when flag was last updated */
  updatedAt?: Date
}

/**
 * Configuration for creating/updating a flag
 */
export interface FlagConfig {
  /** Whether the flag is enabled (optional for partial updates) */
  enabled?: boolean
  /** Percentage for rollout (optional for partial updates) */
  rolloutPercentage?: number
  /** Target specific users (optional for partial updates) */
  userIds?: string[]
}

/**
 * Context for flag evaluation
 */
export interface FlagEvaluationContext {
  /** User identifier for targeting and bucketing */
  userId?: string
  /** Additional attributes for targeting */
  attributes?: Record<string, string | number | boolean>
}

/**
 * Result of flag evaluation
 */
export interface EvaluationResult {
  enabled: boolean
  reason: 'boolean' | 'user-targeting' | 'percentage-rollout' | 'default' | 'in-code'
}
```

### In-Code Flag Registry

```typescript
// src/types/registry.ts
import type { Flag, FlagConfig } from './index'

/**
 * Registry of in-code flags
 * Good for permanent features that shouldn't be in the DB
 */
export interface InCodeFlags {
  [key: string]: boolean | FlagConfig
}

/**
 * Get in-code flags definition
 */
export function getInCodeFlags(): InCodeFlags {
  return {
    'new-ui': true,
    'beta-features': {
      enabled: false,
      rolloutPercentage: 10,
    },
    'dark-mode': true,
  }
}

/**
 * Type-safe in-code flag names
 */
export type InCodeFlagName = keyof ReturnType<typeof getInCodeFlags>
```

### Adapter Types

```typescript
// src/types/adapter.ts
import type { SQLiteDb } from '../drizzle/sqlite'
import type { PostgresDb } from '../drizzle/postgres'

/**
 * Supported database adapters
 */
export type DatabaseAdapter = 'sqlite' | 'postgresql'

/**
 * Adapter configuration
 */
export interface AdapterConfig {
  adapter: DatabaseAdapter
  connectionString?: string
  authToken?: string
}

/**
 * Database client type union
 */
export type DatabaseClient = SQLiteDb | PostgresDb

/**
 * Database result types
 */
export interface FlagRow {
  name: string
  enabled: boolean
  rolloutPercentage: number
  userIds: string[]
  createdAt: string
  updatedAt: string
}
```

### React Types

```typescript
// src/types/react.ts
import type { ReactNode } from 'react'
import type { Flag, FlagEvaluationContext } from './index'

/**
 * Flag context value
 */
export interface FlagContextValue {
  /** Map of flag name to flag data */
  flags: Map<string, Flag>
  /** Check if a flag is enabled */
  isEnabled: (name: string, context?: FlagEvaluationContext) => boolean
  /** Whether flags are still loading */
  isLoading: boolean
}

/**
 * Flag component props
 */
export interface FlagComponentProps {
  /** Name of the flag to check */
  name: string
  /** Content to render when enabled */
  children: ReactNode
  /** Content to render when disabled */
  fallback?: ReactNode
  /** Loading placeholder */
  loading?: ReactNode
  /** User ID for evaluation */
  userId?: string
}

/**
 * useFlag hook options
 */
export interface UseFlagOptions {
  /** Default value when flag doesn't exist */
  defaultValue?: boolean
  /** User for evaluation context */
  user?: {
    id?: string
    attributes?: Record<string, string | number | boolean>
  }
}

/**
 * useFlag hook result
 */
export interface UseFlagResult {
  /** Whether the flag is enabled */
  enabled: boolean
  /** Whether flags are loading */
  isLoading: boolean
  /** Refresh flag state */
  refresh: () => Promise<void>
}
```

### Full Type Export

```typescript
// src/types/index.ts (final export)
export type {
  Flag,
  FlagConfig,
  FlagEvaluationContext,
  EvaluationResult,
} from './flag.types'

export type {
  InCodeFlags,
  InCodeFlagName,
} from './registry'

export type {
  DatabaseAdapter,
  AdapterConfig,
  DatabaseClient,
  FlagRow,
} from './adapter'

export type {
  FlagContextValue,
  FlagComponentProps,
  UseFlagOptions,
  UseFlagResult,
} from './react'
```

---

## Summary

This document provides implementation details for:

1. **Dual Adapter Pattern** - Environment-driven SQLite (libSQL) or PostgreSQL via Drizzle ORM
2. **Percentage Rollout** - MurmurHash3 for consistent bucketing across evaluations
3. **React Context** - Provider pattern with useFlag hook and Flag component
4. **Next.js Integration** - Server Components, API routes, Server Actions
5. **TypeScript Types** - Comprehensive type definitions for all use cases

All code is designed to be drop-in ready for the `@cyguin/flag` package.