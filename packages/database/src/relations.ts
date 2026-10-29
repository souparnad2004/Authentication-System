import { defineRelations } from "drizzle-orm";
import * as schema from "./schema/index.js";

export const relations = defineRelations(schema, (r) => ({
  usersTable: {
    passwordCredentials: r.many.passwordCredentialsTable({
      from: r.usersTable.id,
      to: r.passwordCredentialsTable.userId,
    }),
    sessions: r.many.sessionsTable({
      from: r.usersTable.id,
      to: r.sessionsTable.userId,
    }),
    userRoles: r.many.userRolesTable({
      from: r.usersTable.id,
      to: r.userRolesTable.userId,
    }),

    roles: r.many.rolesTable({
      from: r.usersTable.id.through(r.userRolesTable.userId),
      to: r.rolesTable.id.through(r.userRolesTable.roleId),
    }),

    auditLogs: r.many.auditLogsTable({
      from: r.usersTable.id,
      to: r.auditLogsTable.userId,
      alias: "auditLogSubject",
    }),
    actedAuditLogs: r.many.auditLogsTable({
      from: r.usersTable.id,
      to: r.auditLogsTable.actorUserId,
      alias: "auditLogActor",
    }),
  },

  passwordCredentialsTable: {
    user: r.one.usersTable({
      from: r.passwordCredentialsTable.userId,
      to: r.usersTable.id,
    }),
  },

  sessionsTable: {
    user: r.one.usersTable({
      from: r.sessionsTable.userId,
      to: r.usersTable.id,
    }),
    refreshTokens: r.many.refreshTokensTable({
      from: r.sessionsTable.id,
      to: r.refreshTokensTable.sessionId,
    }),
    refreshTokenFamilies: r.many.refreshTokenFamiliesTable({
      from: r.sessionsTable.id,
      to: r.refreshTokenFamiliesTable.sessionId,
    }),
    auditLogs: r.many.auditLogsTable({
      from: r.sessionsTable.id,
      to: r.auditLogsTable.sessionId,
    }),
  },

  refreshTokenFamiliesTable: {
    session: r.one.sessionsTable({
      from: r.refreshTokenFamiliesTable.sessionId,
      to: r.sessionsTable.id,
    }),
    refreshTokens: r.many.refreshTokensTable({
      from: r.refreshTokenFamiliesTable.id,
      to: r.refreshTokensTable.familyId,
    }),
  },

  refreshTokensTable: {
    session: r.one.sessionsTable({
      from: r.refreshTokensTable.sessionId,
      to: r.sessionsTable.id,
    }),
    family: r.one.refreshTokenFamiliesTable({
      from: r.refreshTokensTable.familyId,
      to: r.refreshTokenFamiliesTable.id,
    }),
  },

  rolesTable: {
    userRoles: r.many.userRolesTable({
      from: r.rolesTable.id,
      to: r.userRolesTable.roleId,
    }),
    rolePermissions: r.many.rolePermissionsTable({
      from: r.rolesTable.id,
      to: r.rolePermissionsTable.roleId,
    }),

    permissions: r.many.permissionsTable({
      from: r.rolesTable.id.through(r.rolePermissionsTable.roleId),
      to: r.permissionsTable.id.through(r.rolePermissionsTable.permissionId),
    }),
  },

  userRolesTable: {
    user: r.one.usersTable({
      from: r.userRolesTable.userId,
      to: r.usersTable.id,
    }),
    role: r.one.rolesTable({
      from: r.userRolesTable.roleId,
      to: r.rolesTable.id,
    }),
  },

  permissionsTable: {
    rolePermissions: r.many.rolePermissionsTable({
      from: r.permissionsTable.id,
      to: r.rolePermissionsTable.permissionId,
    }),
    roles: r.many.rolesTable({
      from: r.permissionsTable.id.through(r.rolePermissionsTable.permissionId),
      to: r.rolesTable.id.through(r.rolePermissionsTable.roleId),
    }),
  },

  rolePermissionsTable: {
    role: r.one.rolesTable({
      from: r.rolePermissionsTable.roleId,
      to: r.rolesTable.id,
    }),
    permission: r.one.permissionsTable({
      from: r.rolePermissionsTable.permissionId,
      to: r.permissionsTable.id,
    }),
  },

  auditLogsTable: {
    user: r.one.usersTable({
      from: r.auditLogsTable.userId,
      to: r.usersTable.id,
      alias: "auditLogSubject",
    }),
    actorUser: r.one.usersTable({
      from: r.auditLogsTable.actorUserId,
      to: r.usersTable.id,
      alias: "auditLogActor",
    }),
    session: r.one.sessionsTable({
      from: r.auditLogsTable.sessionId,
      to: r.sessionsTable.id,
    }),
  },
}));
