import { createHash, randomBytes, randomInt, randomUUID } from 'node:crypto';
import type {
  ForgetPasswordRequest,
  LoginUserRequest,
  RegisterUserRequest,
  ResetPasswordRequest,
} from '@repo/contracts';
import { ConflictError } from '../../core/errors/ConflictError.js';
import { ForbiddenError } from '../../core/errors/ForbiddenError.js';
import { UnauthorizedError } from '../../core/errors/UnauthorizedError.js';
import type { PasswordHasher } from '../../infrastructure/security/argon2-password-hasher.js';
import type { TokenManager } from '../../infrastructure/security/jwt-token.service.js';
import type { AuthRepository } from './auth.repository.interface.js';

const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const PASSWORD_RESET_OTP_TTL_MS = 10 * 60 * 1000;
const PASSWORD_RESET_MAX_ATTEMPTS = 5;
const INVALID_RESET_CODE_MESSAGE = 'Invalid or expired password reset code';

function generateOtp(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, '0');
}

export class AuthService {
  constructor(
    private readonly repository: AuthRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly tokenManager: TokenManager,
  ) {}

  async register(input: RegisterUserRequest) {
    const email = input.email.trim().toLowerCase();
    const username = input.username.trim();

    if (await this.repository.findByEmail(email)) {
      throw new ConflictError('Email already registered', 'EMAIL_ALREADY_EXISTS');
    }

    if (await this.repository.existsByUsername(username)) {
      throw new ConflictError('Username already registered', 'USERNAME_ALREADY_EXISTS');
    }

    const passwordHash = await this.passwordHasher.hash(input.password);
    const user = { id: randomUUID(), username, email, passwordHash };
    await this.repository.createUser(user);

    return { id: user.id, username: user.username, email: user.email };
  }

  async login(input: LoginUserRequest) {
    const email = input.email.trim().toLowerCase();
    const user = await this.repository.findForLoginByEmail(email);

    if (!user) {
      throw new UnauthorizedError('Invalid email or password', 'INVALID_CREDENTIALS');
    }

    if (!(await this.passwordHasher.verify(input.password, user.passwordHash))) {
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

    await this.repository.createLoginSession({
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

  async forgetPassword(input: ForgetPasswordRequest) {
    const email = input.email.trim().toLowerCase();
    const user = await this.repository.findByEmail(email);

    if (user?.status === 'active' && user.emailVerified) {
      const otp = generateOtp();
      const otpHash = await this.passwordHasher.hash(otp);

      await this.repository.createPasswordResetChallenge({
        userId: user.id,
        otpHash,
        expiresAt: new Date(Date.now() + PASSWORD_RESET_OTP_TTL_MS),
      });

      // TODO: Send the OTP to the user through the email service.
    }

    return {
      message:
        'If an eligible account exists, reset instructions will be available once email delivery is configured.',
    };
  }

  async resetPassword(input: ResetPasswordRequest) {
    const email = input.email.trim().toLowerCase();
    const user = await this.repository.findByEmail(email);

    if (!user || user.status !== 'active' || !user.emailVerified) {
      throw new UnauthorizedError(INVALID_RESET_CODE_MESSAGE, 'INVALID_OR_EXPIRED_CODE');
    }

    const now = new Date();
    const challenge = await this.repository.findActivePasswordResetChallenge(user.id, now);

    if (!challenge || challenge.attempts >= PASSWORD_RESET_MAX_ATTEMPTS) {
      throw new UnauthorizedError(INVALID_RESET_CODE_MESSAGE, 'INVALID_OR_EXPIRED_CODE');
    }

    if (!(await this.passwordHasher.verify(input.otp, challenge.otpHash))) {
      await this.repository.incrementPasswordResetAttempts(
        challenge.id,
        now,
        PASSWORD_RESET_MAX_ATTEMPTS,
      );
      throw new UnauthorizedError(INVALID_RESET_CODE_MESSAGE, 'INVALID_OR_EXPIRED_CODE');
    }

    const passwordHash = await this.passwordHasher.hash(input.password);
    const reset = await this.repository.resetPassword({
      challengeId: challenge.id,
      userId: user.id,
      passwordHash,
      now,
      maxAttempts: PASSWORD_RESET_MAX_ATTEMPTS,
    });

    if (!reset) {
      throw new UnauthorizedError(INVALID_RESET_CODE_MESSAGE, 'INVALID_OR_EXPIRED_CODE');
    }

    return { message: 'Password reset successful' };
  }
}
