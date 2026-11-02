export interface CreateLoginSession {
  sessionId: string;
  familyId: string;
  refreshTokenId: string;
  userId: string;
  sessionExpiresAt: Date;
  refreshTokenHash: string;
  refreshTokenExpiresAt: Date;
}

export interface SessionRepository {
  createLoginSession(session: CreateLoginSession): Promise<void>;
}
