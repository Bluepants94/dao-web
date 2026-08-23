import {
  createProgressionRules,
  getBreakthroughCost,
  getProgression,
} from '@cultivation/game-rules';

import type { Player } from './types.js';
import type { ProgressionRules, RuleProgression, RuleStatus, SettlementInput } from './rules-contract.js';

const MILLI_AURA = 1_000;
const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
const progressionRules = createProgressionRules();

const statusFor = (level: number, auraMilli: number): RuleStatus => {
  const progression = getProgression(level);
  const ruleResult = progressionRules.settle({ level, auraMilli, onlineMilliseconds: 0, offlineMilliseconds: 0 });
  const requiredAura = ruleResult.nextRequirement / MILLI_AURA;
  const nextRealm = level < 100 ? getProgression(level + 1).realm : progression.realm;
  const canBreakthrough = ruleResult.breakthroughStatus === 'ready';
  const stats = progression.stats;
  return {
    realm: progression.realm.name,
    layer: progression.realm.layer,
    hp: stats.hp,
    mp: stats.mp,
    attack: stats.attack,
    defense: stats.defense,
    speed: stats.speed,
    critical: stats.criticalRateBps / 100,
    evasion: stats.evasionRateBps / 100,
    criticalChance: stats.criticalRateBps / 100,
    dodgeChance: stats.evasionRateBps / 100,
    isOnline: false,
    spiritualEnergy: auraMilli / MILLI_AURA,
    onlineRate: requiredAura / TWELVE_HOURS_MS,
    offlineRate: requiredAura / TWENTY_FOUR_HOURS_MS,
    onlineEnergyRate: requiredAura / TWELVE_HOURS_MS,
    offlineEnergyRate: requiredAura / TWENTY_FOUR_HOURS_MS,
    levelProgress: {
      current: Math.max(0, auraMilli) / MILLI_AURA,
      required: requiredAura,
    },
    breakthrough: {
      canBreakthrough,
      cost: level < 100 ? getBreakthroughCost(level) : 0,
      description: canBreakthrough ? `可突破至${nextRealm.name}·第${nextRealm.layer}层` : '尚未满足突破条件',
    },
    breakthroughStatus: ruleResult.breakthroughStatus,
  };
};

export interface GameRulesAdapter extends ProgressionRules {
  describe: (player: Pick<Player, 'auraMilli' | 'level' | 'breakthroughStatus'>) => RuleStatus;
}

export const createGameRulesAdapter = (): GameRulesAdapter => ({
  settle(input: SettlementInput): RuleProgression {
    return progressionRules.settle({
      level: input.level,
      auraMilli: input.auraMilli,
      onlineMilliseconds: input.onlineMilliseconds,
      offlineMilliseconds: input.offlineMilliseconds,
    });
  },
  breakthrough(player): RuleProgression {
    return progressionRules.breakthrough({
      level: player.level,
      auraMilli: player.auraMilli,
      breakthroughStatus: player.breakthroughStatus,
    });
  },
  describe(player) {
    return statusFor(player.level, player.auraMilli);
  },
});
