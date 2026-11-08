import { and, eq, exists, gt, isNull } from 'drizzle-orm';
import {
  passwordCredentialsTable,
  refreshTokenFamiliesTable,
  refreshTokensTable,
  sessionsTable,
  usersTable,
  type Database,
} from '@repo/database';
import { ConflictError } from '../../core/errors/ConflictError.js';
import type { AuthRepository } from './auth.repository.interface.js';
import type {
  CreateLoginSession,
  LoginSessionByRefreshToken,
  NewAuthUser,
  RotateRefreshToken,
} from './auth.types.js';

export class DrizzleAuthRepository implements AuthRepository {
  constructor(private readonly db: Database) {}

  async existsByEmail(email: string): Promise<boolean> {
    const [user] = await this.db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1);

    return user !== undefined;
  }

  async existsByUsername(username: string): Promise<boolean> {
    const [user] = await this.db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.username, username))
      .limit(1);

    return user !== undefined;
  }

  async findForLoginByEmail(email: string) {
    const [user] = await this.db
      .select({
        id: usersTable.id,
        username: usersTable.username,
        email: usersTable.email,
        emailVerified: usersTable.emailVerified,
        status: usersTable.status,
        createdAt: usersTable.createdAt,
        passwordHash: passwordCredentialsTable.passwordHash,
      })
      .from(usersTable)
      .innerJoin(passwordCredentialsTable, eq(passwordCredentialsTable.userId, usersTable.id))
      .where(eq(usersTable.email, email))
      .limit(1);

    return user;
  }

  async createUser(user: NewAuthUser): Promise<void> {
    try {
      await this.db.transaction(async (tx) => {
        await tx.insert(usersTable).values({
          id: user.id,
          username: user.username,
          email: user.email,
        });

        await tx.insert(passwordCredentialsTable).values({
          userId: user.id,
          passwordHash: user.passwordHash,
        });
      });
    } catch (error) {
      const constraint = getUniqueConstraint(error);

      if (constraint === 'user_email_unique') {
        throw new ConflictError('Email already registered', 'EMAIL_ALREADY_EXISTS');
      }

      if (constraint === 'user_username_unique') {
        throw new ConflictError('Username already registered', 'USERNAME_ALREADY_EXISTS');
      }

      throw error;
    }
  }

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
}

function getUniqueConstraint(error: unknown): string | undefined {
  if (
    typeof error !== 'object' ||
    error === null ||
    !('code' in error) ||
    error.code !== '23505' ||
    !('constraint' in error) ||
    typeof error.constraint !== 'string'
  ) {
    return undefined;
  }

  return error.constraint;
}
