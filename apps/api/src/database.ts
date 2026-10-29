import { parseEnv } from '@repo/config/env';
import { createDatabase } from '@repo/database';
import { z } from 'zod';

const env = parseEnv(
  z.object({
    DATABASE_URL: z.url(),
  }),
);

const database = createDatabase({ url: env.DATABASE_URL });

export const db = database.db;
export const closeDatabase = database.close;
