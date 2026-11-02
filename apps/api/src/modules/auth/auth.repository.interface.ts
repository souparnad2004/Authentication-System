import type { CreateLoginSession, LoginUserRecord, NewAuthUser } from './auth.types.js';

export interface AuthRepository {
  existsByEmail(email: string): Promise<boolean>;
  existsByUsername(username: string): Promise<boolean>;
  findForLoginByEmail(email: string): Promise<LoginUserRecord | undefined>;
  createUser(user: NewAuthUser): Promise<void>;
  createLoginSession(session: CreateLoginSession): Promise<void>;
}
