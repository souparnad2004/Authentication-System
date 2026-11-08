import type {
  CreateLoginSession,
  LoginSessionByRefreshToken,
  LoginUserRecord,
  NewAuthUser,
  RotateRefreshToken,
} from './auth.types.js';

export interface AuthRepository {
  existsByEmail(email: string): Promise<boolean>;
  existsByUsername(username: string): Promise<boolean>;
  findForLoginByEmail(email: string): Promise<LoginUserRecord | undefined>;
  createUser(user: NewAuthUser): Promise<void>;
  createLoginSession(session: CreateLoginSession): Promise<void>;
  findLoginSessionByRefreshTokenHash(
    tokenHash: string,
  ): Promise<LoginSessionByRefreshToken | undefined>;
  rotateRefreshToken(input: RotateRefreshToken): Promise<boolean>;
}
