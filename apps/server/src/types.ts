import type { RuleStatus } from './rules-contract.js';

export type BreakthroughStatus = 'locked' | 'ready';

export interface Player {
  id: string;
  username: string;
  passwordHash: string;
  level: number;
  auraMilli: number;
  lastSeenAt: Date;
  lastSettledAt: Date;
  progressionVersion: number;
  breakthroughStatus: BreakthroughStatus;
}

export interface PublicPlayer {
  id: string;
  username: string;
  level: number;
  aura_milli: number;
  last_seen_at: string;
  last_settled_at: string;
  progression_version: number;
  breakthrough_status: BreakthroughStatus;
  realm: string;
  layer: number;
  hp: number;
  mp: number;
  attack: number;
  defense: number;
  speed: number;
  critical: number;
  evasion: number;
  criticalChance: number;
  dodgeChance: number;
  isOnline: boolean;
  spiritualEnergy: number;
  onlineRate: number;
  offlineRate: number;
  onlineEnergyRate: number;
  offlineEnergyRate: number;
  levelProgress: { current: number; required: number };
  breakthrough: { canBreakthrough: boolean; cost: number; description: string };
}

const emptyStatus: RuleStatus = {
  realm: '', layer: 1, hp: 0, mp: 0, attack: 0, defense: 0, speed: 0,
  critical: 0, evasion: 0, criticalChance: 0, dodgeChance: 0, isOnline: false,
  spiritualEnergy: 0, onlineRate: 1, offlineRate: 0.5, onlineEnergyRate: 1, offlineEnergyRate: 0.5,
  levelProgress: { current: 0, required: 0 }, breakthrough: { canBreakthrough: false, cost: 0, description: '' },
  breakthroughStatus: 'locked',
};

export const toPublicPlayer = (player: Player, now = new Date(), status: RuleStatus = emptyStatus): PublicPlayer => ({
  id: player.id,
  username: player.username,
  level: player.level,
  aura_milli: player.auraMilli,
  last_seen_at: player.lastSeenAt.toISOString(),
  last_settled_at: player.lastSettledAt.toISOString(),
  progression_version: player.progressionVersion,
  breakthrough_status: player.breakthroughStatus,
  ...status,
  isOnline: now.getTime() <= player.lastSeenAt.getTime() + 90_000,
});
