import { Router } from 'express';
import { authBasePath } from '@repo/contracts';
import { createAuthRouter } from '../modules/auth/auth.routes.js';
import type { AuthController } from '../modules/auth/index.js';
import { healthRouter } from '../modules/health/health.routes.js';

export function createRoutes(authController: AuthController) {
  const router = Router();

  router.use(healthRouter);
  router.use(authBasePath, createAuthRouter(authController));

  return router;
}
