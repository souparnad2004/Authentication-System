import type { User } from '../entities/user.entity.js';

export interface UserRepository {
  existsByEmail(email: string): Promise<boolean>;
  existsByUsername(username: string): Promise<boolean>;
  save(user: User): Promise<void>;
}
