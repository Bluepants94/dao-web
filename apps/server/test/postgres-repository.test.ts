import { describe, expect, it } from 'vitest';

import type { DatabaseClient } from '../src/db/client.js';
import { PostgresRepository } from '../src/db/postgres-repository.js';

describe('PostgresRepository', () => {
  it('serializes registration timestamps before passing them to unsafe queries', async () => {
    let values: unknown[] | undefined;
    const row = {
      id: 'player-1',
      username: 'player_001',
      password_hash: 'hash',
      level: 1,
      aura_milli: 0,
      last_seen_at: new Date('2026-08-23T00:00:00.000Z'),
      last_settled_at: new Date('2026-08-23T00:00:00.000Z'),
      progression_version: 1,
      breakthrough_status: 'locked' as const,
    };
    const client = {
      sql: {
        unsafe: async (_query: string, queryValues: unknown[]) => {
          values = queryValues;
          return [row];
        },
      },
    } as unknown as DatabaseClient;

    await new PostgresRepository(client).createPlayer({
      username: 'player_001',
      passwordHash: 'hash',
      now: new Date('2026-08-23T00:00:00.000Z'),
    });

    expect(values?.[3]).toBe('2026-08-23T00:00:00.000Z');
  });

  it('serializes player timestamps before transaction updates', async () => {
    let updateValues: unknown[] | undefined;
    const row = {
      id: 'player-1',
      username: 'player_001',
      password_hash: 'hash',
      level: 1,
      aura_milli: 0,
      last_seen_at: new Date('2026-08-23T00:00:00.000Z'),
      last_settled_at: new Date('2026-08-23T00:00:00.000Z'),
      progression_version: 1,
      breakthrough_status: 'locked' as const,
    };
    const transaction = Object.assign(
      (strings: TemplateStringsArray, ...args: unknown[]) => {
        updateValues = args;
        return Promise.resolve([]);
      },
      { unsafe: async () => [row] },
    );
    const client = {
      sql: {
        begin: async (operation: (tx: typeof transaction) => Promise<unknown>) => operation(transaction),
      },
    } as unknown as DatabaseClient;

    await new PostgresRepository(client).withPlayerLock('player-1', (player) => {
      player.lastSeenAt = new Date('2026-08-23T00:00:30.000Z');
      player.lastSettledAt = new Date('2026-08-23T00:00:30.000Z');
    });

    expect(updateValues).toEqual([1, 0, '2026-08-23T00:00:30.000Z', '2026-08-23T00:00:30.000Z', 1, 'locked', 'player-1']);
  });
});
