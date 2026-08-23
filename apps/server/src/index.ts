import { buildServer } from './app.js';
import { createGameRulesAdapter } from './game-rules-adapter.js';
import { createDatabaseClient } from './db/client.js';
import { PostgresRepository } from './db/postgres-repository.js';
import { InMemoryRepository, type PlayerRepository } from './repository.js';

const repository: PlayerRepository = process.env.DATABASE_URL
  ? new PostgresRepository(createDatabaseClient(process.env.DATABASE_URL))
  : new InMemoryRepository();

const app = buildServer({ repository, rules: createGameRulesAdapter() });
await app.listen({ port: Number(process.env.PORT ?? 3000), host: '0.0.0.0' });
