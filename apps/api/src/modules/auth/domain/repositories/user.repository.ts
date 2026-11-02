import type { User } from '../entities/user.entity.js';

export interface UserRepository {
  existsByEmail(email: string): Promise<boolean>;
  existsByUsername(username: string): Promise<boolean>;
  findForLoginByEmail(email: string): Promise<LoginUserRecord | undefined>;
  save(user: User): Promise<void>;
}

export interface LoginUserRecord {
  id: string;
  username: string;
  email: string;
  emailVerified: boolean;
  createdAt: Date;
  passwordHash: string;
}
