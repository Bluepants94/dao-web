import { randomUUID } from 'node:crypto';

import type { DatabaseClient } from './client.js';
import type { CreatePlayerInput, PlayerRepository } from '../repository.js';
import type { Player } from '../types.js';

type PlayerRow = {
  id: string;
  username: string;
  password_hash: string;
  level: number;
  aura_milli: bigint | number;
  last_seen_at: Date;
  last_settled_at: Date;
  progression_version: number;
  breakthrough_status: Player['breakthroughStatus'];
};

const mapPlayer = (row: PlayerRow): Player => ({
  id: row.id,
  username: row.username,
  passwordHash: row.password_hash,
  level: row.level,
  auraMilli: Number(row.aura_milli),
  lastSeenAt: new Date(row.last_seen_at),
  lastSettledAt: new Date(row.last_settled_at),
  progressionVersion: row.progression_version,
  breakthroughStatus: row.breakthrough_status,
});

const PLAYER_COLUMNS = 'id, username, password_hash, level, aura_milli, last_seen_at, last_settled_at, progression_version, breakthrough_status';

export class PostgresRepository implements PlayerRepository {
  constructor(private readonly client: DatabaseClient) {}

  async createPlayer(input: CreatePlayerInput): Promise<Player> {
    try {
      const timestamp = input.now.toISOString();
      const rows = await this.client.sql.unsafe<PlayerRow[]>(`INSERT INTO players (id, username, password_hash, level, aura_milli, last_seen_at, last_settled_at, progression_version, breakthrough_status)
        VALUES ($1, $2, $3, 1, 0, $4, $4, 1, 'locked') RETURNING ${PLAYER_COLUMNS}`, [randomUUID(), input.username, input.passwordHash, timestamp]);
      return mapPlayer(rows[0]);
    } catch (error) {
      if ((error as { code?: string }).code === '23505') throw new Error('USERNAME_TAKEN');
      throw error;
    }
  }

  async findPlayerByUsername(username: string): Promise<Player | undefined> {
    const rows = await this.client.sql.unsafe<PlayerRow[]>(`SELECT ${PLAYER_COLUMNS} FROM players WHERE username = $1 LIMIT 1`, [username]);
    return rows[0] ? mapPlayer(rows[0]) : undefined;
  }

  async findPlayerBySession(token: string): Promise<Player | undefined> {
    const rows = await this.client.sql.unsafe<PlayerRow[]>(`SELECT ${PLAYER_COLUMNS} FROM players INNER JOIN sessions ON sessions.player_id = players.id WHERE sessions.token = $1 LIMIT 1`, [token]);
    return rows[0] ? mapPlayer(rows[0]) : undefined;
  }

  async createSession(playerId: string): Promise<string> {
    const token = randomUUID();
    await this.client.sql`INSERT INTO sessions (token, player_id) VALUES (${token}, ${playerId})`;
    return token;
  }

  async deleteSession(token: string): Promise<void> { await this.client.sql`DELETE FROM sessions WHERE token = ${token}`; }

  async withPlayerLock<T>(playerId: string, operation: (player: Player) => Promise<T> | T): Promise<T> {
    return this.client.sql.begin(async (transaction) => {
      const rows = await transaction.unsafe<PlayerRow[]>(`SELECT ${PLAYER_COLUMNS} FROM players WHERE id = $1 FOR UPDATE`, [playerId]);
      if (!rows[0]) throw new Error('PLAYER_NOT_FOUND');
      const player = mapPlayer(rows[0]);
      const result = await operation(player);
      await transaction`UPDATE players SET level = ${player.level}, aura_milli = ${player.auraMilli}, last_seen_at = ${player.lastSeenAt.toISOString()}, last_settled_at = ${player.lastSettledAt.toISOString()}, progression_version = ${player.progressionVersion}, breakthrough_status = ${player.breakthroughStatus} WHERE id = ${player.id}`;
      return result;
    }) as Promise<T>;
  }
}
