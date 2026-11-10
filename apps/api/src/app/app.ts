import express from 'express';
import cookieParser from 'cookie-parser';
import { errorHandler } from '../core/errors/errorHandler.js';
import { requestId } from '../core/middleware/requestId.js';
import type { AuthController } from '../modules/auth/index.js';
import { createRoutes } from './routes.js';

export function createApp(authController: AuthController) {
  const app = express();

  app.use(requestId);
  app.use(express.json());
  app.use(cookieParser());
  app.use(createRoutes(authController));
  app.use(errorHandler);

  return app;
}
