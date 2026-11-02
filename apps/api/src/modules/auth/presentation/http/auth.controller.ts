import type { Request, Response } from 'express';
import {
  loginUserContract,
  registerUserContract,
  type LoginResponse,
  type RegisterUserResponse,
} from '@repo/contracts';
import type { LoginUserUseCase } from '../../application/use-cases/login-user.use-case.js';
import type { RegisterUserUseCase } from '../../application/use-cases/register-user.use-case.js';

export class AuthController {
  constructor(
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly loginUserUseCase: LoginUserUseCase,
  ) {}

  register = async (req: Request, res: Response) => {
    const input = registerUserContract.requestSchema.parse(req.body);
    const result = await this.registerUserUseCase.execute(input);

    const response = {
      message: 'Registration successful',
      data: result,
    } satisfies RegisterUserResponse;

    res.status(registerUserContract.status).json(response);
  };

  login = async (req: Request, res: Response) => {
    const input = loginUserContract.requestSchema.parse(req.body);
    const response = (await this.loginUserUseCase.execute(input)) satisfies LoginResponse;

    res.status(loginUserContract.status).json(response);
  };
}
