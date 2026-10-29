import { index, pgTable, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core';
import { sessionsTable } from './session.schema.js';

export const refreshTokensTable = pgTable(
  'refresh_token',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    sessionId: uuid('session_id')
      .notNull()
      .references(() => sessionsTable.id),
    familyId: uuid('family_id')
      .notNull()
      .references(() => refreshTokenFamiliesTable.id),
    tokenHash: text('token_hash').notNull().unique(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('refresh_token_session_id_idx').on(table.sessionId),
    index('refresh_token_family_id_idx').on(table.familyId),
  ],
);

export type RefreshToken = typeof refreshTokensTable.$inferSelect;
export type NewRefreshToken = typeof refreshTokensTable.$inferInsert;

export const refreshTokenFamiliesTable = pgTable(
  'refresh_token_families',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    sessionId: uuid('session_id')
      .notNull()
      .references(() => sessionsTable.id),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('refresh_token_families_session_id_idx').on(table.sessionId),
    unique('refresh_token_families_id_session_id_uq').on(table.id, table.sessionId),
  ],
);

export type RefreshTokenFamily = typeof refreshTokenFamiliesTable.$inferSelect;
export type NewRefreshTokenFamily = typeof refreshTokenFamiliesTable.$inferInsert;
