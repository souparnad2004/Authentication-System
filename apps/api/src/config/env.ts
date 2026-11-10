import { z } from 'zod';
import { parseEnv } from '@repo/config/env';

const envSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  DATABASE_URL: z.url(),
  JWT_SECRET: z.string().min(32),
  REDIS_HOST: z.string().default('127.0.0.1'),
  REDIS_PORT: z.coerce.number().int().min(1).max(65535).default(6379),
  REDIS_PASSWORD: z.string().optional(),
});

export type Environment = z.infer<typeof envSchema>;

export function loadEnvironment(source?: Record<string, string | undefined>): Environment {
  return parseEnv(envSchema, source);
}
