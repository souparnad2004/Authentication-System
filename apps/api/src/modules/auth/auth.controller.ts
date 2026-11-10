import type { Request, Response } from 'express';
import {
  forgetPasswordContract,
  loginUserContract,
  refreshTokenContract,
  registerUserContract,
  resetPasswordContract,
  type ForgetPasswordRequest,
  type LoginResponse,
  type LoginUserRequest,
  type RefreshTokenResponse,
  type RegisterUserRequest,
  type RegisterUserResponse,
  type ResetPasswordRequest,
} from '@repo/contracts';
import { UnauthorizedError } from '../../core/errors/UnauthorizedError.js';
import { refreshCookieOptions } from './shared/refresh-cookie.js';
import type { LoginService } from './login/login.service.js';
import type { PasswordResetService } from './password-reset/password-reset.service.js';
import type { RegisterService } from './register/register.service.js';
import type { SessionService } from './session/session.service.js';

export class AuthController {
  constructor(
    private readonly registerService: RegisterService,
    private readonly loginService: LoginService,
    private readonly sessionService: SessionService,
    private readonly passwordResetService: PasswordResetService,
  ) {}

  register = async (
    req: Request<Record<string, never>, unknown, RegisterUserRequest>,
    res: Response,
  ): Promise<void> => {
    const result = await this.registerService.register(req.body);
    const response = {
      message: 'Registration successful',
      data: result,
    } satisfies RegisterUserResponse;

    res.status(registerUserContract.status).json(response);
  };

  login = async (
    req: Request<Record<string, never>, unknown, LoginUserRequest>,
    res: Response,
  ): Promise<void> => {
    const result = await this.loginService.login(req.body);
    const { refreshTokenExpiresAt, ...response } = result;
    res.cookie('refreshToken', result.refreshToken, refreshCookieOptions(refreshTokenExpiresAt));
    res.status(loginUserContract.status).json(response satisfies LoginResponse);
  };

  refresh = async (
    req: Request<Record<string, never>, unknown, unknown>,
    res: Response,
  ): Promise<void> => {
    const refreshToken: unknown = req.cookies?.refreshToken;
    if (typeof refreshToken !== 'string' || refreshToken.length === 0) {
      throw new UnauthorizedError('Refresh token is required', 'INVALID_REFRESH_TOKEN');
    }

    const result = await this.sessionService.refresh(refreshToken);
    const { refreshToken: newRefreshToken, refreshTokenExpiresAt, ...response } = result;
    res.cookie('refreshToken', newRefreshToken, refreshCookieOptions(refreshTokenExpiresAt));
    res.status(refreshTokenContract.status).json(response satisfies RefreshTokenResponse);
  };

  forgetPassword = async (
    req: Request<Record<string, never>, unknown, ForgetPasswordRequest>,
    res: Response,
  ): Promise<void> => {
    const result = await this.passwordResetService.requestReset(req.body);
    res.status(forgetPasswordContract.status).json(result);
  };

  resetPassword = async (
    req: Request<Record<string, never>, unknown, ResetPasswordRequest>,
    res: Response,
  ): Promise<void> => {
    const result = await this.passwordResetService.resetPassword(req.body);
    res.status(resetPasswordContract.status).json(result);
  };
}
