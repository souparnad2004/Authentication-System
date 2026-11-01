import type { Request, Response } from 'express';
import { registerUserContract, type RegisterUserResponse } from '@repo/contracts';
import type { RegisterUserUseCase } from '../../application/use-cases/register-user.use-case.js';

export class AuthController {
  constructor(private readonly registerUserUseCase: RegisterUserUseCase) {}

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
    // Implement login logic here
    res.status(200).json({ message: 'Login successful' });
  }
}
