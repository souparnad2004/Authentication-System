import { pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const userStatus = pgEnum("user_status", ["active", "inactive", "deleted", "locked", "disabled"])

export const usersTable = pgTable("user", {
    id: uuid("id").defaultRandom().primaryKey(),
    username: text("username").notNull().unique(),
    email: text("email").notNull().unique(),
    status: userStatus("user_status").notNull().default("active"),
    lastLoginAt: timestamp("last_login_at", {withTimezone: true}),
    disabledAt: timestamp("disabled_at", {withTimezone: true}),
    deletedAt: timestamp("deleted_at", {withTimezone: true}),
    createdAt: timestamp("created_at", {withTimezone: true}).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", {withTimezone: true}).notNull().defaultNow().$onUpdate(() => new Date()),
})

export type User = typeof usersTable.$inferSelect;
export type NewUser = typeof usersTable.$inferInsert;
export type UserStatus = (typeof userStatus.enumValues)[number];

