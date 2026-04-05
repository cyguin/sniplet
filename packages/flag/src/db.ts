import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'
import { pgTable, text as pgText, boolean, integer as pgInteger, jsonb, timestamp } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

// SQLite schema
export const flagsSqlite = sqliteTable('flags', {
  name: text('name').primaryKey(),
  enabled: integer('enabled', { mode: 'boolean' }).default(false).notNull(),
  rolloutPercentage: integer('rollout_percentage').default(100).notNull(),
  userIds: text('user_ids').$type<string[]>().default([]),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
})

// PostgreSQL schema
export const flagsPg = pgTable('flags', {
  name: pgText('name').primaryKey(),
  enabled: boolean('enabled').default(false).notNull(),
  rolloutPercentage: pgInteger('rollout_percentage').default(100).notNull(),
  userIds: jsonb('user_ids').$type<string[]>().default([]),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

export type FlagDb = typeof flagsSqlite.$inferSelect
export type FlagDbInsert = typeof flagsSqlite.$inferInsert
