import { parseEnv } from '@repo/config/env';
import express from 'express';
import { ZodError, z } from 'zod';
import { closeDatabase } from './database.js';
import { createAuthModule } from './modules/auth/auth.module.js';
import {
  EmailAlreadyExistsError,
  UsernameAlreadyExistsError,
} from './modules/auth/domain/errors/identity.errors.js';
import { InvalidEmailError } from './modules/auth/domain/value-objects/email.vo.js';

const env = parseEnv(
  z.object({
    PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  }),
);

const app = express();
app.use(express.json());
app.use('/auth', createAuthModule());

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use(
  (error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    if (error instanceof ZodError || error instanceof InvalidEmailError) {
      res.status(400).json({ error: 'Invalid registration input' });
      return;
    }

    if (error instanceof EmailAlreadyExistsError || error instanceof UsernameAlreadyExistsError) {
      res.status(409).json({ error: error.message });
      return;
    }

    console.error('Unhandled API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  },
);

const server = app.listen(env.PORT);

function shutdown() {
  server.close(async (error) => {
    if (error) {
      console.error('Failed to close the API server:', error);
      process.exitCode = 1;
    }

    try {
      await closeDatabase();
    } catch (closeError) {
      console.error('Failed to close the database connection:', closeError);
      process.exitCode = 1;
    }
  });
}

process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);
