import type { AuthUserByEmail, LoginUserRecord, NewAuthUser } from '../shared/auth.types.js';

export interface UserRepository {
  findByEmail(email: string): Promise<AuthUserByEmail | undefined>;
  existsByUsername(username: string): Promise<boolean>;
  findForLoginByEmail(email: string): Promise<LoginUserRecord | undefined>;
  createUser(user: NewAuthUser): Promise<void>;
}
