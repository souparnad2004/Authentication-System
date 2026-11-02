import { eq } from 'drizzle-orm';
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
import type { CreateLoginSession, NewAuthUser } from './auth.types.js';

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
