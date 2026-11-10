import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { ForbiddenError } from '../../../core/errors/ForbiddenError.js';
import { UnauthorizedError } from '../../../core/errors/UnauthorizedError.js';
import type { TokenManager } from '../../../infrastructure/security/jwt-token.service.js';
import { ACCESS_TOKEN_TTL_SECONDS, REFRESH_TOKEN_TTL_MS } from '../shared/auth.constants.js';
import type { SessionRepository } from './session.repository.interface.js';

export class SessionService {
  constructor(
    private readonly repository: SessionRepository,
    private readonly tokenManager: TokenManager,
  ) {}

  async refresh(refreshToken: string) {
    const session = await this.repository.findLoginSessionByRefreshTokenHash(
      createHash('sha256').update(refreshToken).digest('hex'),
    );

    if (!session) {
      throw new UnauthorizedError('Invalid refresh token', 'INVALID_REFRESH_TOKEN');
    }

    const now = new Date();

    if (session.refreshTokenRevokedAt || session.familyRevokedAt || session.sessionRevokedAt) {
      throw new UnauthorizedError('Refresh token is no longer valid', 'SESSION_REVOKED');
    }

    if (session.refreshTokenExpiresAt <= now || session.sessionExpiresAt <= now) {
      throw new UnauthorizedError('Refresh token expired', 'REFRESH_TOKEN_EXPIRED');
    }

    if (session.status !== 'active') {
      throw new ForbiddenError('Account is not available for login');
    }

    if (!session.emailVerified) {
      throw new ForbiddenError('Email is not verified', 'EMAIL_NOT_VERIFIED');
    }

    const refreshTokenId = randomUUID();
    const newRefreshToken = randomBytes(32).toString('base64url');
    const newRefreshTokenExpiresAt = new Date(now.getTime() + REFRESH_TOKEN_TTL_MS);
    const accessToken = this.tokenManager.generateToken(
      { sub: session.userId, sid: session.sessionId, email: session.email },
      `${ACCESS_TOKEN_TTL_SECONDS}s`,
    );
    const rotated = await this.repository.rotateRefreshToken({
      currentRefreshTokenId: session.refreshTokenId,
      sessionId: session.sessionId,
      familyId: session.familyId,
      newRefreshTokenId: refreshTokenId,
      newRefreshTokenHash: createHash('sha256').update(newRefreshToken).digest('hex'),
      newRefreshTokenExpiresAt,
      now,
    });

    if (!rotated) {
      throw new UnauthorizedError('Invalid refresh token', 'INVALID_REFRESH_TOKEN');
    }

    return {
      accessToken,
      refreshToken: newRefreshToken,
      refreshTokenExpiresAt: newRefreshTokenExpiresAt,
      tokenType: 'Bearer' as const,
      expiresIn: ACCESS_TOKEN_TTL_SECONDS,
    };
  }
}
