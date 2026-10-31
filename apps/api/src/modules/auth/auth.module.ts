import { db } from '../../database.js';
import { RegisterUser } from './application/use-cases/register-user.use-case.js';
import { DrizzleUserRepository } from './infrastructure/persistence/drizzle-user.repository.js';
import { ScryptPasswordHasher } from './infrastructure/security/scrypt-password-hasher.js';
import { AuthController } from './presentation/http/auth.controller.js';
import { createAuthRouter } from './presentation/http/auth.routes.js';

export function createAuthModule() {
  const users = new DrizzleUserRepository(db);
  const passwordHasher = new ScryptPasswordHasher();
  const registerUser = new RegisterUser(users, passwordHasher);
  const controller = new AuthController(registerUser);

  return createAuthRouter(controller);
}
