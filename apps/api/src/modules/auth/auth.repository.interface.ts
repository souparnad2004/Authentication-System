import type {
  AuthUserByEmail,
  CreateLoginSession,
  LoginSessionByRefreshToken,
  LoginUserRecord,
  NewAuthUser,
  NewPasswordResetChallenge,
  PasswordResetChallengeRecord,
  RotateRefreshToken,
  ResetPassword,
} from './auth.types.js';

export interface AuthRepository {
  findByEmail(email: string): Promise<AuthUserByEmail | undefined>;
  existsByUsername(username: string): Promise<boolean>;
  findForLoginByEmail(email: string): Promise<LoginUserRecord | undefined>;
  createUser(user: NewAuthUser): Promise<void>;
  createLoginSession(session: CreateLoginSession): Promise<void>;
  findLoginSessionByRefreshTokenHash(
    tokenHash: string,
  ): Promise<LoginSessionByRefreshToken | undefined>;
  rotateRefreshToken(input: RotateRefreshToken): Promise<boolean>;
  createPasswordResetChallenge(input: NewPasswordResetChallenge): Promise<void>;
  findActivePasswordResetChallenge(
    userId: string,
    now: Date,
  ): Promise<PasswordResetChallengeRecord | undefined>;
  incrementPasswordResetAttempts(
    challengeId: string,
    now: Date,
    maxAttempts: number,
  ): Promise<boolean>;
  resetPassword(input: ResetPassword): Promise<boolean>;
}
