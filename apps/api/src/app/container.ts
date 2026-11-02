import type { Database } from '@repo/database';
import type { AppConfig } from '../config/config.js';
import { Argon2PasswordHasher } from '../infrastructure/security/argon2-password-hasher.js';
import { JwtTokenService } from '../infrastructure/security/jwt-token.service.js';
import { DrizzleAuthRepository } from '../modules/auth/auth.repository.js';
import { AuthService } from '../modules/auth/auth.service.js';

export function createContainer(database: Database, config: AppConfig) {
  const authRepository = new DrizzleAuthRepository(database);
  const passwordHasher = new Argon2PasswordHasher();
  const tokenManager = new JwtTokenService(config.jwtSecret);

  return {
    authService: new AuthService(authRepository, passwordHasher, tokenManager),
  };
}
