import { parseEnv } from '@repo/config/env';
import express from 'express';
import { z } from 'zod';
import { closeDatabase } from './database.js';

const env = parseEnv(
  z.object({
    PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  }),
);

const app = express();

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

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
