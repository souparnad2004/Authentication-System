import { pgTable, primaryKey, text, timestamp, uuid, index} from "drizzle-orm/pg-core";
import { usersTable } from "./user.schema.js";

export const rolesTable = pgTable("role", {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull().unique().default("user"),
    createdAt: timestamp("created_at", {withTimezone: true}).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", {withTimezone: true}).notNull().defaultNow().$onUpdate(() => new Date()),
})


export type Role = typeof rolesTable.$inferSelect;
export type NewRole = typeof rolesTable.$inferInsert;

export const userRolesTable = pgTable("user_roles", {
    userId: uuid("user_id").notNull().references(() => usersTable.id),
    roleId: uuid("role_id").notNull().references(() => rolesTable.id),
},(table) => [
    primaryKey({columns: [table.userId, table.roleId]}),
    index("user_roles_role_id_idx").on(table.roleId),
])


export type UserRole = typeof userRolesTable.$inferSelect;
export type NewUserRole = typeof userRolesTable.$inferInsert;

export const permissionsTable = pgTable("permission", {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull().unique(),
    createdAt: timestamp("created_at", {withTimezone: true}).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", {withTimezone: true}).notNull().defaultNow().$onUpdate(() => new Date()),
})

export type Permission = typeof permissionsTable.$inferSelect
export type NewPermission = typeof permissionsTable.$inferInsert

export const rolePermissionsTable = pgTable("role_permissions", {
    roleId: uuid("role_id").notNull().references(() => rolesTable.id, { onDelete: "cascade" }),
    permissionId: uuid("permission_id").notNull().references(() => permissionsTable.id, { onDelete: "cascade" }),
}, (table) => [
    primaryKey({ columns: [table.roleId, table.permissionId] }),
    index("role_permissions_permission_id_idx").on(table.permissionId),
]);

export type RolePermission = typeof rolePermissionsTable.$inferSelect;
export type NewRolePermission = typeof rolePermissionsTable.$inferInsert;

