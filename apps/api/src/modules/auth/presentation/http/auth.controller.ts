import type { Request, Response } from 'express';
import type { RegisterUser } from '../../application/use-cases/register-user.use-case.js';
import { registerSchema } from './auth.schema.js';

export class AuthController {
  constructor(private readonly registerUser: RegisterUser) {}

  register = async (req: Request, res: Response) => {
    const input = registerSchema.parse(req.body);
    const result = await this.registerUser.execute(input);

    res.status(201).json({
      message: 'Registration successful',
      data: result,
    });
  };
}
