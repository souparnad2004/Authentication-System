import { randomUUID } from 'node:crypto';
import type { RegisterUserDTO } from '../dto/register-user.dto.js';
import type { PasswordHasher } from '../ports/password-hasher.port.js';
import type { UserRepository } from '../../domain/repositories/user.repository.js';
import {
  EmailAlreadyExistsError,
  UsernameAlreadyExistsError,
} from '../../domain/errors/identity.errors.js';
import { User } from '../../domain/entities/user.entity.js';
import { Email } from '../../domain/value-objects/email.vo.js';

export class RegisterUser {
  constructor(
    private readonly users: UserRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(input: RegisterUserDTO) {
    const email = Email.create(input.email);
    const username = input.username.trim();

    if (await this.users.existsByEmail(email.value)) {
      throw new EmailAlreadyExistsError();
    }

    if (await this.users.existsByUsername(username)) {
      throw new UsernameAlreadyExistsError();
    }

    const passwordHash = await this.passwordHasher.hash(input.password);

    const user = User.create({
      id: randomUUID(),
      username,
      email,
      passwordHash,
    });

    await this.users.save(user);

    return {
      id: user.id,
      username: user.username,
      email: user.email.value,
    };
  }
}
