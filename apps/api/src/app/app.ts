import express from 'express';
import cookieParser from 'cookie-parser';
import { errorHandler } from '../core/errors/errorHandler.js';
import { requestId } from '../core/middleware/requestId.js';
import type { AuthService } from '../modules/auth/auth.service.js';
import { createRoutes } from './routes.js';

export function createApp(authService: AuthService) {
  const app = express();

  app.use(requestId);
  app.use(express.json());
  app.use(cookieParser());
  app.use(createRoutes(authService));
  app.use(errorHandler);

  return app;
}
