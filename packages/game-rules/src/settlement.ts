import { getBreakthroughCost, getUpgradeAura } from './aura.js';
import { clampLevel } from './realm.js';

const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;
const AURA_MILLI = 1000;

export type BreakthroughStatus = 'locked' | 'ready';

export interface SettlementInput {
  readonly level: number;
  readonly auraMilli: number;
  readonly onlineMilliseconds: number;
  readonly offlineMilliseconds: number;
}

export interface BreakthroughInput {
  readonly level: number;
  readonly auraMilli: number;
  readonly breakthroughStatus: BreakthroughStatus;
}

export interface SettlementResult {
  readonly level: number;
  readonly auraMilli: number;
  readonly breakthroughStatus: BreakthroughStatus;
  /** Total aura, in milli-aura, required by the current level's next action. */
  readonly nextRequirement: number;
}

export interface ProgressionRules {
  settle(input: SettlementInput): SettlementResult;
  breakthrough(input: BreakthroughInput): SettlementResult;
}

const normalizeAura = (auraMilli: number): number => Math.max(0, Math.floor(auraMilli));

const realmGate = (level: number): boolean => level % 10 === 0 && level < 100;

const nextRequirement = (level: number): number => {
  if (level >= 100) return 0;
  const upgradeCost = getUpgradeAura(level) * AURA_MILLI;
  return upgradeCost + (realmGate(level) ? getBreakthroughCost(level) * AURA_MILLI : 0);
};

const statusFor = (level: number, auraMilli: number): BreakthroughStatus => (
  realmGate(level) && auraMilli >= nextRequirement(level) ? 'ready' : 'locked'
);

const resultFor = (level: number, auraMilli: number): SettlementResult => ({
  level,
  auraMilli,
  breakthroughStatus: statusFor(level, auraMilli),
  nextRequirement: nextRequirement(level),
});

const gainedAuraMilli = (level: number, onlineMilliseconds: number, offlineMilliseconds: number): number => {
  const costMilli = getUpgradeAura(level) * AURA_MILLI;
  const online = Math.max(0, onlineMilliseconds);
  const offline = Math.max(0, offlineMilliseconds);
  const weightedMilliseconds = online + offline * 0.5;
  return Math.max(0, Math.floor((costMilli * weightedMilliseconds) / TWELVE_HOURS_MS + 0.5));
};

const spendOrdinaryLevels = (level: number, auraMilli: number): SettlementResult => {
  let currentLevel = level;
  let remainingAura = auraMilli;

  while (currentLevel < 100 && !realmGate(currentLevel)) {
    const costMilli = getUpgradeAura(currentLevel) * AURA_MILLI;
    if (remainingAura < costMilli) break;
    remainingAura -= costMilli;
    currentLevel += 1;
  }

  return resultFor(currentLevel, remainingAura);
};

export function settleProgression(input: SettlementInput): SettlementResult {
  const level = clampLevel(input.level);
  const auraMilli = normalizeAura(input.auraMilli);
  if (level >= 100) return resultFor(100, auraMilli);

  const withGain = auraMilli + gainedAuraMilli(level, input.onlineMilliseconds, input.offlineMilliseconds);
  return spendOrdinaryLevels(level, withGain);
}

export function breakthroughProgression(input: BreakthroughInput): SettlementResult {
  const level = clampLevel(input.level);
  const auraMilli = normalizeAura(input.auraMilli);
  if (!realmGate(level) || auraMilli < nextRequirement(level)) return resultFor(level, auraMilli);

  return resultFor(level + 1, auraMilli - nextRequirement(level));
}

export function createProgressionRules(): ProgressionRules {
  return { settle: settleProgression, breakthrough: breakthroughProgression };
}
