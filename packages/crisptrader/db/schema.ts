import { pgTable, text, timestamp, boolean, numeric, varchar, integer } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: varchar('id', { length: 255 }).primaryKey(),
  clerkId: varchar('clerk_id', { length: 255 }).notNull().unique(),
  email: varchar('email', { length: 255 }).notNull(),
  plan: varchar('plan', { length: 50 }).notNull().default('free'),
  stripeCustomerId: varchar('stripe_customer_id', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const alerts = pgTable('alerts', {
  id: varchar('id', { length: 255 }).primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull().references(() => users.id),
  metal: varchar('metal', { length: 50 }).notNull(),
  currency: varchar('currency', { length: 10 }).notNull().default('USD'),
  threshold: numeric('threshold', { precision: 12, scale: 2 }).notNull(),
  direction: varchar('direction', { length: 10 }).notNull(),
  active: boolean('active').notNull().default(true),
  lastSpot: numeric('last_spot', { precision: 12, scale: 2 }),
  lastCheckedAt: timestamp('last_checked_at'),
  lastFiredAt: timestamp('last_fired_at'),
  snoozeUntil: timestamp('snooze_until'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const priceChecks = pgTable('price_checks', {
  id: varchar('id', { length: 255 }).primaryKey(),
  metal: varchar('metal', { length: 50 }).notNull(),
  currency: varchar('currency', { length: 10 }).notNull(),
  spotPrice: numeric('spot_price', { precision: 12, scale: 2 }).notNull(),
  observedAt: timestamp('observed_at').defaultNow().notNull(),
  payloadHash: varchar('payload_hash', { length: 64 }).notNull().unique(),
});

export const notifications = pgTable('notifications', {
  id: varchar('id', { length: 255 }).primaryKey(),
  alertId: varchar('alert_id', { length: 255 }).notNull().references(() => alerts.id),
  channel: varchar('channel', { length: 20 }).notNull(),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  sentAt: timestamp('sent_at'),
  error: text('error'),
});
