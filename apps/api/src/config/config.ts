import { loadEnvironment } from './env.js';

export interface AppConfig {
  port: number;
  databaseUrl: string;
  jwtSecret: string;
}

export function loadConfig(source?: Record<string, string | undefined>): AppConfig {
  const env = loadEnvironment(source);

  return {
    port: env.PORT,
    databaseUrl: env.DATABASE_URL,
    jwtSecret: env.JWT_SECRET,
  } satisfies AppConfig;
}
