import { eq } from 'drizzle-orm';
import { passwordCredentialsTable, usersTable, type Database } from '@repo/database';
import type { UserRepository } from '../../domain/repositories/user.repository.js';
import type { User } from '../../domain/entities/user.entity.js';
import {
  EmailAlreadyExistsError,
  UsernameAlreadyExistsError,
} from '../../domain/errors/identity.errors.js';

export class DrizzleUserRepository implements UserRepository {
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

  async save(user: User): Promise<void> {
    try {
      await this.db.transaction(async (tx) => {
        await tx.insert(usersTable).values({
          id: user.id,
          username: user.username,
          email: user.email.value,
        });

        await tx.insert(passwordCredentialsTable).values({
          userId: user.id,
          passwordHash: user.passwordHash,
        });
      });
    } catch (error) {
      const constraint = getUniqueConstraint(error);

      if (constraint === 'user_email_unique') {
        throw new EmailAlreadyExistsError();
      }

      if (constraint === 'user_username_unique') {
        throw new UsernameAlreadyExistsError();
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
