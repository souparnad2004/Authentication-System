import type { Request, Response } from 'express';
import {
  loginUserContract,
  registerUserContract,
  type LoginUserRequest,
  type LoginResponse,
  type RegisterUserRequest,
  type RegisterUserResponse,
} from '@repo/contracts';
import type { AuthService } from './auth.service.js';

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
    const response = (await this.authService.login(input)) satisfies LoginResponse;

    res.status(loginUserContract.status).json(response);
  };
}
