import { loadEnvironment } from './env.js';

export interface AppConfig {
  port: number;
  databaseUrl: string;
  jwtSecret: string;
  redis: {
    host: string;
    port: number;
    password?: string;
  };
}

export function loadConfig(source?: Record<string, string | undefined>): AppConfig {
  const env = loadEnvironment(source);

  return {
    port: env.PORT,
    databaseUrl: env.DATABASE_URL,
    jwtSecret: env.JWT_SECRET,
    redis: {
      host: env.REDIS_HOST,
      port: env.REDIS_PORT,
      ...(env.REDIS_PASSWORD ? { password: env.REDIS_PASSWORD } : {}),
    },
  } satisfies AppConfig;
}
