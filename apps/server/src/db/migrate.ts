import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { Sql } from 'postgres';

import { createDatabaseClient } from './client.js';

const migrationUrl = new URL('../../drizzle/0000_initial.sql', import.meta.url);

export const runMigrations = async (sql: Sql): Promise<void> => {
  await sql.unsafe(await readFile(fileURLToPath(migrationUrl), 'utf8'));
};

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error('DATABASE_URL is required for db:migrate');
  const client = createDatabaseClient(databaseUrl);
  try { await runMigrations(client.sql); } finally { await client.sql.end(); }
}
