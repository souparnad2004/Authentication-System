import { randomUUID } from 'node:crypto';
import type { RegisterUserRequest } from '@repo/contracts';
import { ConflictError } from '../../../core/errors/ConflictError.js';
import type { PasswordHasher } from '../../../infrastructure/security/argon2-password-hasher.js';
import type { UserRepository } from '../user/user.repository.interface.js';

export class RegisterService {
  constructor(
    private readonly users: UserRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async register(input: RegisterUserRequest) {
    const email = input.email.trim().toLowerCase();
    const username = input.username.trim();

    if (await this.users.findByEmail(email)) {
      throw new ConflictError('Email already registered', 'EMAIL_ALREADY_EXISTS');
    }

    if (await this.users.existsByUsername(username)) {
      throw new ConflictError('Username already registered', 'USERNAME_ALREADY_EXISTS');
    }

    const passwordHash = await this.passwordHasher.hash(input.password);
    const user = { id: randomUUID(), username, email, passwordHash };
    await this.users.createUser(user);

    return { id: user.id, username: user.username, email: user.email };
  }
}
