import { randomUUID } from 'node:crypto';
import type { RegisterUserRequest } from '@repo/contracts';
import type { PasswordHasher } from '../ports/password-hasher.port.js';
import type { UserRepository } from '../../domain/repositories/user.repository.js';
import {
  EmailAlreadyExistsError,
  UsernameAlreadyExistsError,
} from '../../domain/errors/identity.errors.js';
import { User } from '../../domain/entities/user.entity.js';
import { Email } from '../../domain/value-objects/email.vo.js';

export class RegisterUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(input: RegisterUserRequest) {
    const email = Email.create(input.email);
    const username = input.username.trim();

    if (await this.userRepository.existsByEmail(email.value)) {
      throw new EmailAlreadyExistsError();
    }

    if (await this.userRepository.existsByUsername(username)) {
      throw new UsernameAlreadyExistsError();
    }

    const passwordHash = await this.passwordHasher.hash(input.password);

    const user = User.create({
      id: randomUUID(),
      username,
      email,
      passwordHash,
    });

    await this.userRepository.save(user);

    return {
      id: user.id,
      username: user.username,
      email: user.email.value,
    };
  }
}
