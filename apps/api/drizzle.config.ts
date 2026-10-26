/// <reference types="node" />
import { defineConfig } from 'drizzle-kit';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required to use Drizzle Kit.');
}

export default defineConfig({
  out: '../../packages/database/migrations',
  schema: '../../packages/database/src/schema/**/*.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: databaseUrl,
  },
});
