import { createApp } from './app/app.js';
import { createContainer } from './app/container.js';
import { loadConfig } from './config/config.js';
import { connectDatabase } from './infrastructure/database/client.js';

const config = loadConfig();
const database = connectDatabase(config.databaseUrl);
const container = createContainer(database.db, config);
const app = createApp(container.authController);
const server = app.listen(config.port);

function shutdown(signal: string): void {
  server.close((serverError) => {
    if (serverError) {
      console.error(`Failed to close the API server after ${signal}:`, serverError);
      process.exitCode = 1;
    }

    void database.close().catch((databaseError: unknown) => {
      console.error(`Failed to close the database after ${signal}:`, databaseError);
      process.exitCode = 1;
    });
    void container.redis.quit().catch((redisError: unknown) => {
      console.error(`Failed to close Redis after ${signal}:`, redisError);
      process.exitCode = 1;
    });
  });
}

process.once('SIGINT', () => shutdown('SIGINT'));
process.once('SIGTERM', () => shutdown('SIGTERM'));
