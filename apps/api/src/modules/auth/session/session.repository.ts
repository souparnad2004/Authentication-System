import { and, eq, exists, gt, isNull, sql } from 'drizzle-orm';
import {
  passwordCredentialsTable,
  refreshTokenFamiliesTable,
  refreshTokensTable,
  sessionsTable,
  usersTable,
  type Database,
} from '@repo/database';
import type {
  CreateLoginSession,
  LoginSessionByRefreshToken,
  ResetPassword,
  RotateRefreshToken,
} from '../shared/auth.types.js';
import type { SessionRepository } from './session.repository.interface.js';

export class DrizzleSessionRepository implements SessionRepository {
  constructor(private readonly db: Database) {}

  async createLoginSession(session: CreateLoginSession): Promise<void> {
    await this.db.transaction(async (tx) => {
      await tx.insert(sessionsTable).values({
        id: session.sessionId,
        userId: session.userId,
        expiresAt: session.sessionExpiresAt,
      });

      await tx.insert(refreshTokenFamiliesTable).values({
        id: session.familyId,
        sessionId: session.sessionId,
      });

      await tx.insert(refreshTokensTable).values({
        id: session.refreshTokenId,
        sessionId: session.sessionId,
        familyId: session.familyId,
        tokenHash: session.refreshTokenHash,
        expiresAt: session.refreshTokenExpiresAt,
      });
    });
  }

  async findLoginSessionByRefreshTokenHash(
    tokenHash: string,
  ): Promise<LoginSessionByRefreshToken | undefined> {
    const [session] = await this.db
      .select({
        refreshTokenId: refreshTokensTable.id,
        refreshTokenExpiresAt: refreshTokensTable.expiresAt,
        refreshTokenRevokedAt: refreshTokensTable.revokedAt,
        familyId: refreshTokenFamiliesTable.id,
        familyRevokedAt: refreshTokenFamiliesTable.revokedAt,
        sessionId: sessionsTable.id,
        sessionExpiresAt: sessionsTable.expiresAt,
        sessionRevokedAt: sessionsTable.revokedAt,
        userId: usersTable.id,
        username: usersTable.username,
        email: usersTable.email,
        emailVerified: usersTable.emailVerified,
        status: usersTable.status,
        createdAt: usersTable.createdAt,
      })
      .from(refreshTokensTable)
      .innerJoin(sessionsTable, eq(refreshTokensTable.sessionId, sessionsTable.id))
      .innerJoin(
        refreshTokenFamiliesTable,
        eq(refreshTokensTable.familyId, refreshTokenFamiliesTable.id),
      )
      .innerJoin(usersTable, eq(sessionsTable.userId, usersTable.id))
      .where(eq(refreshTokensTable.tokenHash, tokenHash))
      .limit(1);

    return session;
  }

  async rotateRefreshToken(input: RotateRefreshToken): Promise<boolean> {
    return this.db.transaction(async (tx) => {
      const [activeSession] = await tx
        .update(sessionsTable)
        .set({
          expiresAt: input.newRefreshTokenExpiresAt,
          lastUsedAt: input.now,
        })
        .where(
          and(
            eq(sessionsTable.id, input.sessionId),
            isNull(sessionsTable.revokedAt),
            gt(sessionsTable.expiresAt, input.now),
          ),
        )
        .returning({ id: sessionsTable.id });

      if (!activeSession) {
        return false;
      }

      const [consumedToken] = await tx
        .update(refreshTokensTable)
        .set({ revokedAt: input.now })
        .where(
          and(
            eq(refreshTokensTable.id, input.currentRefreshTokenId),
            eq(refreshTokensTable.sessionId, input.sessionId),
            eq(refreshTokensTable.familyId, input.familyId),
            isNull(refreshTokensTable.revokedAt),
            gt(refreshTokensTable.expiresAt, input.now),
            exists(
              tx
                .select({ id: sessionsTable.id })
                .from(sessionsTable)
                .where(
                  and(
                    eq(sessionsTable.id, input.sessionId),
                    isNull(sessionsTable.revokedAt),
                    gt(sessionsTable.expiresAt, input.now),
                  ),
                ),
            ),
            exists(
              tx
                .select({ id: refreshTokenFamiliesTable.id })
                .from(refreshTokenFamiliesTable)
                .where(
                  and(
                    eq(refreshTokenFamiliesTable.id, input.familyId),
                    isNull(refreshTokenFamiliesTable.revokedAt),
                  ),
                ),
            ),
          ),
        )
        .returning({ id: refreshTokensTable.id });

      if (!consumedToken) {
        return false;
      }

      await tx.insert(refreshTokensTable).values({
        id: input.newRefreshTokenId,
        sessionId: input.sessionId,
        familyId: input.familyId,
        tokenHash: input.newRefreshTokenHash,
        expiresAt: input.newRefreshTokenExpiresAt,
      });

      return true;
    });
  }

  async resetPassword(input: ResetPassword): Promise<void> {
    await this.db.transaction(async (tx) => {
      const [credential] = await tx
        .update(passwordCredentialsTable)
        .set({
          passwordHash: input.passwordHash,
          passwordChangedAt: input.now,
          passwordVersion: sql`${passwordCredentialsTable.passwordVersion} + 1`,
        })
        .where(eq(passwordCredentialsTable.userId, input.userId))
        .returning({ userId: passwordCredentialsTable.userId });

      if (!credential) {
        throw new Error('Password credential not found during password reset');
      }

      await tx
        .update(sessionsTable)
        .set({ revokedAt: input.now })
        .where(and(eq(sessionsTable.userId, input.userId), isNull(sessionsTable.revokedAt)));
    });
  }
}
