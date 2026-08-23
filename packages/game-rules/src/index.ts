import { getCumulativeAura, getUpgradeAura } from './aura.js';
import { getRealm, type Realm } from './realm.js';
import { getStats, type Stats } from './stats.js';

export { getBreakthroughCost, getCumulativeAura, getUpgradeAura } from './aura.js';
export { clampLevel, getRealm } from './realm.js';
export { getStats } from './stats.js';
export type { Realm } from './realm.js';
export type { Stats } from './stats.js';
export {
  breakthroughProgression,
  createProgressionRules,
  settleProgression,
} from './settlement.js';
export type {
  BreakthroughInput,
  BreakthroughStatus,
  ProgressionRules,
  SettlementInput,
  SettlementResult,
} from './settlement.js';

export interface Progression {
  readonly level: number;
  readonly realm: Realm;
  readonly stats: Stats;
  readonly upgradeAura: number;
  readonly cumulativeAura: number;
}

export function getProgression(level: number): Progression {
  const realm = getRealm(level);
  return {
    level: realm.startLevel + realm.layer - 1,
    realm,
    stats: getStats(level),
    upgradeAura: getUpgradeAura(level),
    cumulativeAura: getCumulativeAura(level),
  };
}
