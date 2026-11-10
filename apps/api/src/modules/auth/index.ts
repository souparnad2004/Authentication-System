import type { Database } from '@repo/database';
import type { AppConfig } from '../../config/config.js';
import { createRedisClient } from '../../infrastructure/redis/redis.js';
import { Argon2PasswordHasher } from '../../infrastructure/security/argon2-password-hasher.js';
import { JwtTokenService } from '../../infrastructure/security/jwt-token.service.js';
import { AuthController } from './auth.controller.js';
import { LoginService } from './login/login.service.js';
import { RedisPasswordResetChallengeStore } from './password-reset/password-reset-challenge.store.js';
import { PasswordResetService } from './password-reset/password-reset.service.js';
import { RegisterService } from './register/register.service.js';
import { DrizzleSessionRepository } from './session/session.repository.js';
import { SessionService } from './session/session.service.js';
import { DrizzleUserRepository } from './user/user.repository.js';

export { AuthController };

export function createAuthModule(database: Database, config: AppConfig) {
  const redis = createRedisClient(config.redis);
  const users = new DrizzleUserRepository(database);
  const sessions = new DrizzleSessionRepository(database);
  const challenges = new RedisPasswordResetChallengeStore(redis);
  const passwordHasher = new Argon2PasswordHasher();
  const tokenManager = new JwtTokenService(config.jwtSecret);

  const controller = new AuthController(
    new RegisterService(users, passwordHasher),
    new LoginService(users, sessions, passwordHasher, tokenManager),
    new SessionService(sessions, tokenManager),
    new PasswordResetService(users, sessions, challenges, passwordHasher),
  );

  return { controller, redis };
}
