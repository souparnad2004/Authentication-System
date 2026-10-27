import { index, pgTable, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { sessionsTable } from "./session.schema.js";

export const refreshTokenFamiliesTable = pgTable("refresh_token_families", {
    id: uuid("id").defaultRandom().primaryKey(),
    sessionId: uuid("session_id").notNull().references(() => sessionsTable.id),
    revokedAt: timestamp("revoked_at", {withTimezone: true}),
    createdAt: timestamp("created_at", {withTimezone: true}).notNull().defaultNow(),
},(table) => [
    index("refresh_token_families_session_id_idx").on(table.sessionId),
    unique("refresh_token_families_id_session_id_uq").on(table.id, table.sessionId),
])