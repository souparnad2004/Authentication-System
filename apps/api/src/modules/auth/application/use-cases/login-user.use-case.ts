import { createHash, randomBytes, randomUUID } from 'node:crypto';
import type { LoginUserRequest } from '@repo/contracts';
import type { PasswordHasher } from '../ports/password-hasher.port.js';
import type { SessionRepository } from '../ports/session-repository.port.js';
import type { TokenManagerPort } from '../ports/token-manager.port.js';
import type { UserRepository } from '../../domain/repositories/user.repository.js';
import {
  EmailNotVerifiedError,
  UserNotFoundError,
  WrongCredentialsError,
} from '../../domain/errors/identity.errors.js';

const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export class LoginUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly tokenManager: TokenManagerPort,
    private readonly sessionRepository: SessionRepository,
  ) {}

  async execute(input: LoginUserRequest) {
    const normalizedEmail = input.email.trim().toLowerCase();
    const user = await this.userRepository.findForLoginByEmail(normalizedEmail);

    if (!user) {
      throw new UserNotFoundError();
    }

    if (!user.emailVerified) {
      throw new EmailNotVerifiedError();
    }

    if (!(await this.passwordHasher.verify(input.password, user.passwordHash))) {
      throw new WrongCredentialsError();
    }

    const now = new Date();
    const sessionId = randomUUID();
    const familyId = randomUUID();
    const refreshTokenId = randomUUID();
    const refreshToken = randomBytes(32).toString('base64url');
    const refreshTokenExpiresAt = new Date(now.getTime() + REFRESH_TOKEN_TTL_MS);
    const accessToken = this.tokenManager.generateToken(
      { sub: user.id, sid: sessionId, email: user.email },
      `${ACCESS_TOKEN_TTL_SECONDS}s`,
    );

    await this.sessionRepository.createLoginSession({
      sessionId,
      familyId,
      refreshTokenId,
      userId: user.id,
      sessionExpiresAt: refreshTokenExpiresAt,
      refreshTokenHash: createHash('sha256').update(refreshToken).digest('hex'),
      refreshTokenExpiresAt,
    });

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt.toISOString(),
      },
      accessToken,
      refreshToken,
      tokenType: 'Bearer' as const,
      expiresIn: ACCESS_TOKEN_TTL_SECONDS,
    };
  }
}
