import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import {relations} from "./relations.js";

export interface DatabaseOptions {
  url: string;
  maxConnections?:number;
}

export function createDatabase({ url, maxConnections = 10}: DatabaseOptions) {
  const pool = new Pool({ connectionString: url, max: maxConnections });
  const db = drizzle({client: pool,  relations });

  return {
    db,
    close:() => pool.end(),
  }
}

export type Database = ReturnType<typeof createDatabase>['db'];