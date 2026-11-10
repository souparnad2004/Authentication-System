import type {
  CreateLoginSession,
  LoginSessionByRefreshToken,
  ResetPassword,
  RotateRefreshToken,
} from '../shared/auth.types.js';

export interface SessionRepository {
  createLoginSession(session: CreateLoginSession): Promise<void>;
  findLoginSessionByRefreshTokenHash(
    tokenHash: string,
  ): Promise<LoginSessionByRefreshToken | undefined>;
  rotateRefreshToken(input: RotateRefreshToken): Promise<boolean>;
  resetPassword(input: ResetPassword): Promise<void>;
}
