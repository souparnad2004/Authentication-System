import { index, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { usersTable } from "./user.schema.js";
import { sessionsTable } from "./session.schema.js";

export const auditLogsTable = pgTable("audit_log", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull().references(() => usersTable.id),
    actorUserId: uuid("actor_user_id").references(() => usersTable.id),
    sessionId: uuid("session_id").references(() => sessionsTable.id),
    eventType: text("event_type").notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    metadata: jsonb("metadata").notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
    index("audit_log_user_id_idx").on(table.userId),
    index("audit_log_actor_user_id_idx").on(table.actorUserId),
    index("audit_log_session_id_idx").on(table.sessionId),
])