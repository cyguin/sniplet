import { drizzle } from 'drizzle-orm/libsql'
import { createClient } from '@libsql/client'
import { flagsSqlite, type FlagDb } from '../db'
import { eq } from 'drizzle-orm'
import { getAdapterConfig } from './adapter'
import type { Flag, FlagConfig } from '../types'

let dbInstance: ReturnType<typeof drizzle> | null = null

function getDrizzleDb() {
  if (dbInstance) return dbInstance
  
  const config = getAdapterConfig()
  const client = createClient({
    url: config.connectionString || 'file:local.db',
    authToken: config.authToken,
  })
  
  dbInstance = drizzle(client, { schema: { flags: flagsSqlite } })
  return dbInstance
}

export async function getDb(name: string): Promise<Flag | null> {
  const db = getDrizzleDb()
  const result = await db.select().from(flagsSqlite).where(eq(flagsSqlite.name, name))
  const row = result[0]
  
  if (!row) return null
  
  return {
    name: row.name,
    enabled: Boolean(row.enabled),
    rolloutPercentage: row.rolloutPercentage,
    userIds: row.userIds || [],
    createdAt: row.createdAt || undefined,
    updatedAt: row.updatedAt || undefined,
  }
}

export async function getAllFlagsDb(): Promise<Flag[]> {
  const db = getDrizzleDb()
  const result = await db.select().from(flagsSqlite)
  
  return result.map(row => ({
    name: row.name,
    enabled: Boolean(row.enabled),
    rolloutPercentage: row.rolloutPercentage,
    userIds: row.userIds || [],
    createdAt: row.createdAt || undefined,
    updatedAt: row.updatedAt || undefined,
  }))
}

export async function setFlagDb(name: string, config: FlagConfig): Promise<void> {
  const db = getDrizzleDb()
  const now = new Date().toISOString()
  
  const existing = await db.select().from(flagsSqlite).where(eq(flagsSqlite.name, name))
  
  if (existing.length > 0) {
    await db.update(flagsSqlite)
      .set({
        enabled: config.enabled ?? existing[0].enabled,
        rolloutPercentage: config.rolloutPercentage ?? existing[0].rolloutPercentage,
        userIds: config.userIds ?? existing[0].userIds,
        updatedAt: now,
      })
      .where(eq(flagsSqlite.name, name))
  } else {
    await db.insert(flagsSqlite).values({
      name,
      enabled: config.enabled ?? false,
      rolloutPercentage: config.rolloutPercentage ?? 100,
      userIds: config.userIds ?? [],
      createdAt: now,
      updatedAt: now,
    })
  }
}

export async function deleteFlagDb(name: string): Promise<void> {
  const db = getDrizzleDb()
  await db.delete(flagsSqlite).where(eq(flagsSqlite.name, name))
}

export { getDrizzleDb }
