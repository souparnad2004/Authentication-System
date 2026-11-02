import { createDatabase } from '@repo/database';

export function connectDatabase(databaseUrl: string) {
  return createDatabase({ url: databaseUrl });
}
