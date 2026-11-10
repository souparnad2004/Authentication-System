import { eq } from 'drizzle-orm';
import { passwordCredentialsTable, usersTable, type Database } from '@repo/database';
import { ConflictError } from '../../../core/errors/ConflictError.js';
import type { UserRepository } from './user.repository.interface.js';
import type { AuthUserByEmail, LoginUserRecord, NewAuthUser } from '../shared/auth.types.js';

export class DrizzleUserRepository implements UserRepository {
  constructor(private readonly db: Database) {}

  async findByEmail(email: string): Promise<AuthUserByEmail | undefined> {
    const [user] = await this.db
      .select({
        id: usersTable.id,
        username: usersTable.username,
        email: usersTable.email,
        emailVerified: usersTable.emailVerified,
        status: usersTable.status,
        createdAt: usersTable.createdAt,
      })
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1);

    return user;
  }

  async existsByUsername(username: string): Promise<boolean> {
    const [user] = await this.db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.username, username))
      .limit(1);

    return user !== undefined;
  }

  async findForLoginByEmail(email: string): Promise<LoginUserRecord | undefined> {
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
