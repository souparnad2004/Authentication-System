import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { usersTable } from "./user.schema.js";

export const passwordCredentialsTable = pgTable("password_credentials", {
    id: uuid("uuid").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull().references(() => usersTable.id),
    passwordHash: text("password_hash").notNull(),
    passwordVersion: integer("password_version").notNull().default(1),
    passwordChangedAt: timestamp("password_changed_at", {withTimezone: true}),
    createdAt: timestamp("created_at", {withTimezone: true}).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", {withTimezone: true}).notNull().defaultNow().$onUpdate(() => new Date()),
})


export type PasswordCredentials = typeof passwordCredentialsTable;
export type PasswordCredential = typeof passwordCredentialsTable.$inferSelect;