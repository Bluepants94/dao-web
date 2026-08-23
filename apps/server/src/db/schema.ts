import { bigint, integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const players = pgTable('players', {
  id: text('id').primaryKey(),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  level: integer('level').notNull(),
  auraMilli: bigint('aura_milli', { mode: 'number' }).notNull(),
  lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).notNull(),
  lastSettledAt: timestamp('last_settled_at', { withTimezone: true }).notNull(),
  progressionVersion: integer('progression_version').notNull(),
  breakthroughStatus: text('breakthrough_status').notNull(),
});

export const sessions = pgTable('sessions', {
  token: text('token').primaryKey(),
  playerId: text('player_id').notNull().references(() => players.id, { onDelete: 'cascade' }),
});
