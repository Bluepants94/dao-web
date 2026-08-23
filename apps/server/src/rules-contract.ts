import type { BreakthroughStatus, Player } from './types.js';

export interface SettlementInput {
  level: number;
  auraMilli: number;
  onlineMilliseconds: number;
  offlineMilliseconds: number;
  onlineRatePermille: 1000;
  offlineRatePermille: 500;
}

export interface RuleProgression {
  auraMilli: number;
  level: number;
  breakthroughStatus: BreakthroughStatus;
  nextRequirement: number;
}

export interface RuleStatus {
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
  breakthroughStatus: BreakthroughStatus;
}

/**
 * Adapter contract for @cultivation/game-rules. Game formulas belong in that
 * package; the server only supplies elapsed online/offline time and persists
 * the returned progression state.
 */
export interface ProgressionRules {
  settle(input: SettlementInput): RuleProgression;
  breakthrough(player: Pick<Player, 'auraMilli' | 'level' | 'breakthroughStatus'>): RuleProgression;
  describe?: (player: Pick<Player, 'auraMilli' | 'level' | 'breakthroughStatus'>) => RuleStatus;
}
