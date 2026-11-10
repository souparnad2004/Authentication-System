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

export interface AuthUserByEmail {
  id: string;
  username: string;
  email: string;
  emailVerified: boolean;
  status: UserStatus;
  createdAt: Date;
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

export interface LoginSessionByRefreshToken {
  refreshTokenId: string;
  refreshTokenExpiresAt: Date;
  refreshTokenRevokedAt: Date | null;
  familyId: string;
  familyRevokedAt: Date | null;
  sessionId: string;
  sessionExpiresAt: Date;
  sessionRevokedAt: Date | null;
  userId: string;
  username: string;
  email: string;
  emailVerified: boolean;
  status: UserStatus;
  createdAt: Date;
}

export interface RotateRefreshToken {
  currentRefreshTokenId: string;
  sessionId: string;
  familyId: string;
  newRefreshTokenId: string;
  newRefreshTokenHash: string;
  newRefreshTokenExpiresAt: Date;
  now: Date;
}

export interface PasswordResetChallengeRecord {
  id: string;
  userId: string;
  otpHash: string;
  expiresAt: Date;
  attempts: number;
}

export interface ResetPassword {
  userId: string;
  passwordHash: string;
  now: Date;
}
