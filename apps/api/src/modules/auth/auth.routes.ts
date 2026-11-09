import { Router } from 'express';
import {
  forgetPasswordContract,
  loginUserContract,
  refreshTokenContract,
  registerUserContract,
  resetPasswordContract,
} from '@repo/contracts';
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
  router.post(refreshTokenContract.path, controller.refresh);

  router.post(
    forgetPasswordContract.path,
    validateBody(forgetPasswordContract.requestSchema),
    controller.forgetPassword,
  );
  router.post(
    resetPasswordContract.path,
    validateBody(resetPasswordContract.requestSchema),
    controller.resetPassword,
  );
  return router;
}
