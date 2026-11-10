import type { Database } from '@repo/database';
import type { AppConfig } from '../config/config.js';
import { createAuthModule } from '../modules/auth/index.js';

export function createContainer(database: Database, config: AppConfig) {
  const auth = createAuthModule(database, config);

  return {
    authController: auth.controller,
    redis: auth.redis,
  };
}
