import { randomUUID } from 'node:crypto';

import type { Player } from './types.js';

export interface CreatePlayerInput {
  username: string;
  passwordHash: string;
  now: Date;
}

export interface PlayerRepository {
  createPlayer(input: CreatePlayerInput): Promise<Player>;
  findPlayerByUsername(username: string): Promise<Player | undefined>;
  findPlayerBySession(token: string): Promise<Player | undefined>;
  createSession(playerId: string): Promise<string>;
  deleteSession(token: string): Promise<void>;
  withPlayerLock<T>(playerId: string, operation: (player: Player) => Promise<T> | T): Promise<T>;
}

const copyPlayer = (player: Player): Player => ({ ...player, lastSeenAt: new Date(player.lastSeenAt), lastSettledAt: new Date(player.lastSettledAt) });

export class InMemoryRepository implements PlayerRepository {
  private readonly players = new Map<string, Player>();
  private readonly idsByUsername = new Map<string, string>();
  private readonly sessions = new Map<string, string>();
  private readonly locks = new Map<string, Promise<void>>();

  async createPlayer(input: CreatePlayerInput): Promise<Player> {
    if (this.idsByUsername.has(input.username)) throw new Error('USERNAME_TAKEN');
    const player: Player = {
      id: randomUUID(), username: input.username, passwordHash: input.passwordHash,
      level: 1, auraMilli: 0, lastSeenAt: new Date(input.now), lastSettledAt: new Date(input.now),
      progressionVersion: 1, breakthroughStatus: 'locked',
    };
    this.players.set(player.id, player);
    this.idsByUsername.set(player.username, player.id);
    return copyPlayer(player);
  }

  async findPlayerByUsername(username: string): Promise<Player | undefined> {
    const id = this.idsByUsername.get(username);
    const player = id ? this.players.get(id) : undefined;
    return player && copyPlayer(player);
  }

  async findPlayerBySession(token: string): Promise<Player | undefined> {
    const player = this.players.get(this.sessions.get(token) ?? '');
    return player && copyPlayer(player);
  }

  async createSession(playerId: string): Promise<string> {
    const token = randomUUID();
    this.sessions.set(token, playerId);
    return token;
  }

  async deleteSession(token: string): Promise<void> { this.sessions.delete(token); }

  async withPlayerLock<T>(playerId: string, operation: (player: Player) => Promise<T> | T): Promise<T> {
    const previous = this.locks.get(playerId) ?? Promise.resolve();
    let release!: () => void;
    const current = new Promise<void>((resolve) => { release = resolve; });
    const queued = previous.then(() => current);
    this.locks.set(playerId, queued);
    await previous;
    try {
      const player = this.players.get(playerId);
      if (!player) throw new Error('PLAYER_NOT_FOUND');
      const result = await operation(player);
      return result;
    } finally {
      release();
      if (this.locks.get(playerId) === queued) this.locks.delete(playerId);
    }
  }
}
