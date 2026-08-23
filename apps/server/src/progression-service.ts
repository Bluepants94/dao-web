import type { PlayerRepository } from './repository.js';
import type { ProgressionRules } from './rules-contract.js';
import type { Player } from './types.js';

export const HEARTBEAT_INTERVAL_MS = 30_000;
const ONLINE_TIMEOUT_MS = 90_000;
const ONLINE_RATE_PERMILLE = 1000 as const;
const OFFLINE_RATE_PERMILLE = 500 as const;

export class ProgressionService {
  constructor(private readonly repository: PlayerRepository, private readonly rules: ProgressionRules) {}

  async settle(playerId: string, now: Date): Promise<Player> {
    return this.repository.withPlayerLock(playerId, (player) => {
      const onlineEnd = new Date(Math.min(now.getTime(), player.lastSeenAt.getTime() + ONLINE_TIMEOUT_MS));
      const onlineMilliseconds = Math.max(0, onlineEnd.getTime() - player.lastSettledAt.getTime());
      const offlineMilliseconds = Math.max(0, now.getTime() - Math.max(player.lastSettledAt.getTime(), onlineEnd.getTime()));
      const next = this.rules.settle({ level: player.level, auraMilli: player.auraMilli, onlineMilliseconds, offlineMilliseconds, onlineRatePermille: ONLINE_RATE_PERMILLE, offlineRatePermille: OFFLINE_RATE_PERMILLE });
      player.auraMilli = next.auraMilli;
      player.level = Math.min(100, next.level);
      player.breakthroughStatus = next.breakthroughStatus;
      player.lastSettledAt = new Date(now);
      return player;
    });
  }

  async heartbeat(playerId: string, now: Date): Promise<Player> {
    await this.settle(playerId, now);
    return this.repository.withPlayerLock(playerId, (player) => {
      player.lastSeenAt = new Date(now);
      return player;
    });
  }

  async breakthrough(playerId: string, now: Date): Promise<Player> {
    await this.settle(playerId, now);
    return this.repository.withPlayerLock(playerId, (player) => {
      if (player.breakthroughStatus !== 'ready') throw new Error('BREAKTHROUGH_NOT_READY');
      const next = this.rules.breakthrough(player);
      player.auraMilli = next.auraMilli;
      player.level = Math.min(100, next.level);
      player.breakthroughStatus = next.breakthroughStatus;
      player.progressionVersion += 1;
      return player;
    });
  }
}
