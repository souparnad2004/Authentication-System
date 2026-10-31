import { db } from '../../database.js';
import { RegisterUserUseCase } from './application/use-cases/register-user.use-case.js';
import { DrizzleUserRepository } from './infrastructure/persistence/drizzle-user.repository.js';
import { Argon2PasswordHasher } from './infrastructure/security/argon2-password-hasher.js';
import { AuthController } from './presentation/http/auth.controller.js';
import { createAuthRouter } from './presentation/http/auth.routes.js';

export function createAuthModule() {
  const userRepository = new DrizzleUserRepository(db);
  const passwordHasher = new Argon2PasswordHasher();
  const registerUserUseCase = new RegisterUserUseCase(userRepository, passwordHasher);
  const controller = new AuthController(registerUserUseCase);

  return createAuthRouter(controller);
}
