import { integer, index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { usersTable } from './user.schema.js';

export const passwordResetChallengesTable = pgTable(
  'password_reset_challenge',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    otpHash: text('otp_hash').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    attempts: integer('attempts').notNull().default(0),
    consumedAt: timestamp('consumed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('password_reset_challenge_user_id_idx').on(table.userId)],
);

export type PasswordResetChallenge = typeof passwordResetChallengesTable.$inferSelect;
export type NewPasswordResetChallenge = typeof passwordResetChallengesTable.$inferInsert;
