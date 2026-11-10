import { randomInt, randomUUID } from 'node:crypto';
import type { ForgetPasswordRequest, ResetPasswordRequest } from '@repo/contracts';
import type { PasswordHasher } from '../../../infrastructure/security/argon2-password-hasher.js';
import {
  PASSWORD_RESET_MAX_ATTEMPTS,
  PASSWORD_RESET_OTP_TTL_MS,
} from '../shared/auth.constants.js';
import type { ResetPassword } from '../shared/auth.types.js';
import type { PasswordResetChallengeStore } from './password-reset-challenge.store.interface.js';
import type { SessionRepository } from '../session/session.repository.interface.js';
import type { UserRepository } from '../user/user.repository.interface.js';
import { UnauthorizedError } from '../../../core/errors/UnauthorizedError.js';

const INVALID_RESET_CODE_MESSAGE = 'Invalid or expired password reset code';

function generateOtp(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, '0');
}

function invalidResetCodeError(): UnauthorizedError {
  return new UnauthorizedError(INVALID_RESET_CODE_MESSAGE, 'INVALID_OR_EXPIRED_CODE');
}

export class PasswordResetService {
  constructor(
    private readonly users: UserRepository,
    private readonly sessions: SessionRepository,
    private readonly challenges: PasswordResetChallengeStore,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async requestReset(input: ForgetPasswordRequest) {
    const email = input.email.trim().toLowerCase();
    const user = await this.users.findByEmail(email);

    if (user?.status === 'active' && user.emailVerified) {
      const otp = generateOtp();
      const otpHash = await this.passwordHasher.hash(otp);

      await this.challenges.create({
        id: randomUUID(),
        userId: user.id,
        otpHash,
        attempts: 0,
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
    const user = await this.users.findByEmail(email);

    if (!user || user.status !== 'active' || !user.emailVerified) {
      throw invalidResetCodeError();
    }

    const now = new Date();
    const challenge = await this.challenges.findActive(user.id, now);

    if (!challenge || challenge.attempts >= PASSWORD_RESET_MAX_ATTEMPTS) {
      throw invalidResetCodeError();
    }

    if (!(await this.passwordHasher.verify(input.otp, challenge.otpHash))) {
      await this.challenges.incrementAttempts(user.id, challenge.id, PASSWORD_RESET_MAX_ATTEMPTS);
      throw invalidResetCodeError();
    }

    const passwordHash = await this.passwordHasher.hash(input.password);
    const consumed = await this.challenges.consume(
      user.id,
      challenge.id,
      PASSWORD_RESET_MAX_ATTEMPTS,
      now,
    );

    if (!consumed) {
      throw invalidResetCodeError();
    }

    const reset: ResetPassword = { userId: user.id, passwordHash, now };
    await this.sessions.resetPassword(reset);

    return { message: 'Password reset successful' };
  }
}
