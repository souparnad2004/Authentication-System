import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { sessionsTable } from "./session.schema.js";
import { refreshTokenFamiliesTable } from "./refreshTokenFamily.schema.js";

export const refreshTokensTable = pgTable("refresh_token", {
    id: uuid("id").defaultRandom().primaryKey(),
    sessionId: uuid("session_id").notNull().references(() => sessionsTable.id),
    familyId: uuid("family_id").notNull().references(() => refreshTokenFamiliesTable.id),
    tokenHash: text("token_hash").notNull().unique(),
    expiresAt: timestamp("expires_at", {withTimezone: true}).notNull(),
    revokedAt: timestamp("revoked_at", {withTimezone: true}),
    createdAt: timestamp("created_at", {withTimezone: true}).notNull().defaultNow(),
},(table) => [
    index("refresh_token_session_id_idx").on(table.sessionId),
    index("refresh_token_family_id_idx").on(table.familyId),
])

export type RefreshToken = typeof refreshTokensTable.$inferSelect
export type NewRefreshToken = typeof refreshTokensTable.$inferInsert