import { pgTable, uuid, text, timestamp, inet, index } from "drizzle-orm/pg-core";
import { usersTable } from "./user.schema.js";

export const sessionsTable = pgTable("session", {
    id: uuid("uuid").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull().references(() => usersTable.id),
    expiresAt: timestamp("expires_at", {withTimezone: true}).notNull(),
    revokedAt: timestamp("revoked_at", {withTimezone: true}),
    lastUsedAt: timestamp("last_used_at", {withTimezone: true}),
    ipAddress: inet("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", {withTimezone: true}).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", {withTimezone: true}).notNull().defaultNow().$onUpdate(() => new Date()),
},(table) => [
    index("session_user_id_idx").on(table.userId)
])

export type Session = typeof sessionsTable.$inferSelect
export type NewSession = typeof sessionsTable.$inferInsert