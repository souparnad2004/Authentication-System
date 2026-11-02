import { db } from '../../database.js';
import { LoginUserUseCase } from './application/use-cases/login-user.use-case.js';
import { RegisterUserUseCase } from './application/use-cases/register-user.use-case.js';
import { DrizzleUserRepository } from './infrastructure/persistence/drizzle-user.repository.js';
import { DrizzleSessionRepository } from './infrastructure/persistence/drizzle-session.repository.js';
import { Argon2PasswordHasher } from './infrastructure/security/argon2-password-hasher.js';
import { JwtTokenService } from './infrastructure/security/jwt-token.service.js';
import { AuthController } from './presentation/http/auth.controller.js';
import { createAuthRouter } from './presentation/http/auth.routes.js';

export function createAuthModule(jwtSecret: string) {
  const userRepository = new DrizzleUserRepository(db);
  const sessionRepository = new DrizzleSessionRepository(db);
  const passwordHasher = new Argon2PasswordHasher();
  const tokenManager = new JwtTokenService(jwtSecret);
  const registerUserUseCase = new RegisterUserUseCase(userRepository, passwordHasher);
  const loginUserUseCase = new LoginUserUseCase(
    userRepository,
    passwordHasher,
    tokenManager,
    sessionRepository,
  );
  const controller = new AuthController(registerUserUseCase, loginUserUseCase);

  return createAuthRouter(controller);
}
