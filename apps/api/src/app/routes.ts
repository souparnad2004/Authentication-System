import { Router } from 'express';
import { authBasePath } from '@repo/contracts';
import type { AuthService } from '../modules/auth/auth.service.js';
import { AuthController } from '../modules/auth/auth.controller.js';
import { createAuthRouter } from '../modules/auth/auth.routes.js';
import { healthRouter } from '../modules/health/health.routes.js';

export function createRoutes(authService: AuthService) {
  const router = Router();

  router.use(healthRouter);
  router.use(authBasePath, createAuthRouter(new AuthController(authService)));

  return router;
}
