import { createHash, randomBytes, randomUUID } from 'node:crypto';
import type { LoginUserRequest } from '@repo/contracts';
import { ForbiddenError } from '../../../core/errors/ForbiddenError.js';
import { UnauthorizedError } from '../../../core/errors/UnauthorizedError.js';
import type { PasswordHasher } from '../../../infrastructure/security/argon2-password-hasher.js';
import type { TokenManager } from '../../../infrastructure/security/jwt-token.service.js';
import { ACCESS_TOKEN_TTL_SECONDS, REFRESH_TOKEN_TTL_MS } from '../shared/auth.constants.js';
import type { CreateLoginSession } from '../shared/auth.types.js';
import type { SessionRepository } from '../session/session.repository.interface.js';
import type { UserRepository } from '../user/user.repository.interface.js';

export class LoginService {
  constructor(
    private readonly users: UserRepository,
    private readonly sessions: SessionRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly tokenManager: TokenManager,
  ) {}

  async login(input: LoginUserRequest) {
    const email = input.email.trim().toLowerCase();
    const user = await this.users.findForLoginByEmail(email);

    if (!user || !(await this.passwordHasher.verify(input.password, user.passwordHash))) {
      throw new UnauthorizedError('Invalid email or password', 'INVALID_CREDENTIALS');
    }

    if (user.status !== 'active') {
      throw new ForbiddenError('Account is not available for login');
    }

    if (!user.emailVerified) {
      throw new ForbiddenError(
        'Email is not verified. Email delivery is not configured; request a verification link after it is enabled.',
        'EMAIL_NOT_VERIFIED',
      );
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
    const session: CreateLoginSession = {
      sessionId,
      familyId,
      refreshTokenId,
      userId: user.id,
      sessionExpiresAt: refreshTokenExpiresAt,
      refreshTokenHash: createHash('sha256').update(refreshToken).digest('hex'),
      refreshTokenExpiresAt,
    };

    await this.sessions.createLoginSession(session);

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        status: user.status,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt.toISOString(),
      },
      accessToken,
      refreshToken,
      tokenType: 'Bearer' as const,
      expiresIn: ACCESS_TOKEN_TTL_SECONDS,
      refreshTokenExpiresAt,
    };
  }
}
