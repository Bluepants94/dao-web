import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres, { type Sql } from 'postgres';

import * as schema from './schema.js';

export interface DatabaseClient {
  sql: Sql;
  db: PostgresJsDatabase<typeof schema>;
}

export const createDatabaseClient = (databaseUrl: string): DatabaseClient => {
  const sql = postgres(databaseUrl);
  return { sql, db: drizzle(sql, { schema }) };
};
