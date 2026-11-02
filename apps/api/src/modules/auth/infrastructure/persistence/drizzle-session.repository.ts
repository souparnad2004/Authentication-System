import {
  type Database,
  refreshTokenFamiliesTable,
  refreshTokensTable,
  sessionsTable,
} from '@repo/database';
import type {
  CreateLoginSession,
  SessionRepository,
} from '../../application/ports/session-repository.port.js';

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
}
