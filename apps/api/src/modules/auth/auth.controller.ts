import type { Request, Response } from 'express';
import {
  loginUserContract,
  refreshTokenContract,
  registerUserContract,
  type LoginUserRequest,
  type LoginResponse,
  type RegisterUserRequest,
  type RegisterUserResponse,
  type RefreshTokenResponse,
} from '@repo/contracts';
import { UnauthorizedError } from '../../core/errors/UnauthorizedError.js';
import type { AuthService } from './auth.service.js';

const refreshCookieOptions = (expiresAt: Date) => ({
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: refreshTokenContract.fullPath,
  expires: expiresAt,
});

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  register = async (
    req: Request<Record<string, never>, unknown, RegisterUserRequest>,
    res: Response,
  ): Promise<void> => {
    const input = req.body;
    const result = await this.authService.register(input);
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
    const input = req.body;
    const result = await this.authService.login(input);
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

    const result = await this.authService.refresh(refreshToken);
    const { refreshToken: newRefreshToken, refreshTokenExpiresAt, ...response } = result;
    res.cookie('refreshToken', newRefreshToken, refreshCookieOptions(refreshTokenExpiresAt));
    res.status(refreshTokenContract.status).json(response satisfies RefreshTokenResponse);
  };
}
