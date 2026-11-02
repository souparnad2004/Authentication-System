import type { UserStatus } from '@repo/database';

export interface LoginUserRecord {
  id: string;
  username: string;
  email: string;
  emailVerified: boolean;
  status: UserStatus;
  createdAt: Date;
  passwordHash: string;
}

export interface NewAuthUser {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
}

export interface CreateLoginSession {
  sessionId: string;
  familyId: string;
  refreshTokenId: string;
  userId: string;
  sessionExpiresAt: Date;
  refreshTokenHash: string;
  refreshTokenExpiresAt: Date;
}
