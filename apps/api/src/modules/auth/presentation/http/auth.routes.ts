import { Router } from 'express';
import { registerUserContract } from '@repo/contracts';
import type { AuthController } from './auth.controller.js';

export function createAuthRouter(controller: AuthController) {
  const router = Router();
  router.post(registerUserContract.path, controller.register);
  return router;
}
