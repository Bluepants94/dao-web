import { describe, expect, it } from 'vitest';

import { createProgressionRules, getBreakthroughCost, getUpgradeAura } from '@cultivation/game-rules';

import { createGameRulesAdapter } from '../src/game-rules-adapter.js';
import { toPublicPlayer } from '../src/types.js';

describe('game-rules adapter', () => {
  it('exposes realm, stats, rates, progress, and breakthrough state from the real rules package', () => {
    const adapter = createGameRulesAdapter();
    const player = {
      id: 'player-1', username: 'lin', passwordHash: 'hash', level: 11, auraMilli: 0,
      lastSeenAt: new Date('2026-08-23T00:00:00.000Z'), lastSettledAt: new Date('2026-08-23T00:00:00.000Z'),
      progressionVersion: 1, breakthroughStatus: 'locked' as const,
    };

    expect(adapter.describe(player)).toMatchObject({
      realm: '筑基', layer: 1, hp: 10_540, mp: 6_510, attack: 2_480, defense: 1_039, speed: 2_015,
      criticalChance: 6, dodgeChance: 3.5, spiritualEnergy: 0, onlineRate: getUpgradeAura(11) / (12 * 60 * 60 * 1000), offlineRate: getUpgradeAura(11) / (24 * 60 * 60 * 1000),
      levelProgress: { current: 0, required: getUpgradeAura(11) },
    });
  });

  it('accumulates one current-level cost in 12 online hours and spends the ordinary level', () => {
    const adapter = createGameRulesAdapter();
    const expected = createProgressionRules().settle({ level: 1, auraMilli: 0, onlineMilliseconds: 12 * 60 * 60 * 1000, offlineMilliseconds: 0 });

    const result = adapter.settle({ level: 1, auraMilli: 0, onlineMilliseconds: 12 * 60 * 60 * 1000, offlineMilliseconds: 0, onlineRatePermille: 1000, offlineRatePermille: 500 });

    expect(result).toEqual(expected);
    expect(result).toMatchObject({ level: 2, auraMilli: 0 });
  });

  it('automatically spends multiple ordinary-level costs but stops at the realm gate', () => {
    const adapter = createGameRulesAdapter();
    const auraMilli = (getUpgradeAura(1) + getUpgradeAura(2)) * 1_000;

    const result = adapter.settle({ level: 1, auraMilli, onlineMilliseconds: 0, offlineMilliseconds: 0, onlineRatePermille: 1000, offlineRatePermille: 500 });

    expect(result).toMatchObject({ level: 3, auraMilli: 0, breakthroughStatus: 'locked' });
  });

  it('marks the level-10 realm gate ready at upgrade plus breakthrough cost', () => {
    const adapter = createGameRulesAdapter();
    const required = getUpgradeAura(10) + getBreakthroughCost(10);
    const result = adapter.settle({ level: 10, auraMilli: required * 1_000, onlineMilliseconds: 0, offlineMilliseconds: 0, onlineRatePermille: 1000, offlineRatePermille: 500 });

    expect(result).toMatchObject({ level: 10, auraMilli: required * 1_000, breakthroughStatus: 'ready' });
    expect(adapter.describe({ level: 10, auraMilli: required * 1_000, breakthroughStatus: 'ready' })).toMatchObject({
      levelProgress: { current: required, required },
      onlineRate: required / (12 * 60 * 60 * 1000),
      offlineRate: required / (24 * 60 * 60 * 1000),
      breakthrough: { canBreakthrough: true, cost: getBreakthroughCost(10) },
    });
  });

  it('delegates breakthrough once without charging the gate twice', () => {
    const adapter = createGameRulesAdapter();
    const required = (getUpgradeAura(10) + getBreakthroughCost(10)) * 1_000;
    const ready = adapter.settle({ level: 10, auraMilli: required, onlineMilliseconds: 0, offlineMilliseconds: 0, onlineRatePermille: 1000, offlineRatePermille: 500 });
    const brokenThrough = adapter.breakthrough({ level: ready.level, auraMilli: ready.auraMilli, breakthroughStatus: ready.breakthroughStatus });
    const settledAgain = adapter.settle({ level: brokenThrough.level, auraMilli: brokenThrough.auraMilli, onlineMilliseconds: 0, offlineMilliseconds: 0, onlineRatePermille: 1000, offlineRatePermille: 500 });

    expect(brokenThrough).toMatchObject({ level: 11, auraMilli: 0, breakthroughStatus: 'locked' });
    expect(settledAgain).toMatchObject({ level: 11, auraMilli: 0, breakthroughStatus: 'locked' });
  });

  it('marks a player offline at the 90-second boundary when building the public response', () => {
    const adapter = createGameRulesAdapter();
    const player = {
      id: 'player-1', username: 'lin', passwordHash: 'hash', level: 1, auraMilli: 0,
      lastSeenAt: new Date('2026-08-23T00:00:00.000Z'), lastSettledAt: new Date('2026-08-23T00:00:00.000Z'),
      progressionVersion: 1, breakthroughStatus: 'locked' as const,
    };

    expect(toPublicPlayer(player, new Date('2026-08-23T00:01:30.001Z'), adapter.describe(player)).isOnline).toBe(false);
    expect(toPublicPlayer(player, new Date('2026-08-23T00:01:30.000Z'), adapter.describe(player)).isOnline).toBe(true);
  });
});
