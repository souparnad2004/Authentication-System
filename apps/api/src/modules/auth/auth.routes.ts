import { Router } from 'express';
import { loginUserContract, registerUserContract } from '@repo/contracts';
import { validateBody } from '../../core/middleware/validateBody.js';
import type { AuthController } from './auth.controller.js';

export function createAuthRouter(controller: AuthController) {
  const router = Router();

  router.post(
    registerUserContract.path,
    validateBody(registerUserContract.requestSchema),
    controller.register,
  );
  router.post(
    loginUserContract.path,
    validateBody(loginUserContract.requestSchema),
    controller.login,
  );

  return router;
}
