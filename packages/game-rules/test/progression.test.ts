import { describe, expect, it } from 'vitest';
import {
  getBreakthroughCost,
  getProgression,
  getStats,
} from '../src/index.js';

const roundHalfUp = (value: number) => Math.floor(value + 0.5);

describe('progression rules v1', () => {
  it.each([
    [1, { hp: 5000, mp: 3000, attack: 1200, defense: 500, speed: 1000 }],
    [10, { hp: 10400, mp: 6600, attack: 2280, defense: 950, speed: 1900 }],
    [11, { hp: 10540, mp: 6510, attack: 2480, defense: 1039, speed: 2015 }],
    [50, { hp: 101587, mp: 65801, attack: 22395, defense: 9408, speed: 17893 }],
    [51, { hp: 125253, mp: 80519, attack: 28629, defense: 12078, speed: 22367 }],
    [100, { hp: 1373621, mp: 898534, attack: 303643, defense: 128067, speed: 237543 }],
  ])('returns formula-derived stats at level %i', (level, expected) => {
    expect(getStats(level)).toEqual({ ...expected, criticalRateBps: expect.any(Number), evasionRateBps: expect.any(Number) });
  });

  it('uses percentage points as basis points and caps them', () => {
    expect(getStats(1)).toMatchObject({ criticalRateBps: 500, evasionRateBps: 300 });
    expect(getStats(100)).toMatchObject({ criticalRateBps: 1400, evasionRateBps: 750 });
    expect(getStats(100).criticalRateBps).toBeLessThanOrEqual(1500);
    expect(getStats(100).evasionRateBps).toBeLessThanOrEqual(800);
  });

  it('returns realm and progression information without storing naked stats', () => {
    expect(getProgression(11).realm).toMatchObject({ index: 1, name: '筑基', layer: 1 });
    expect(getProgression(1)).not.toHaveProperty('nakedStats');
    expect(getStats(1)).not.toHaveProperty('base');
  });

  it('calculates upgrade aura and breakthrough costs from the formulas', () => {
    expect(getProgression(1).upgradeAura).toBe(10);
    expect(getProgression(10).upgradeAura).toBe(280);
    expect(getProgression(11).upgradeAura).toBe(370);
    expect(getProgression(50).upgradeAura).toBe(8497);
    expect(getProgression(51).upgradeAura).toBe(9887);
    expect(getProgression(100).upgradeAura).toBe(57680);
    expect(getBreakthroughCost(10)).toBe(840);
    expect(getBreakthroughCost(50)).toBe(25491);
    expect(getBreakthroughCost(90)).toBe(125679);
  });

  it('keeps upgrade aura positive and monotonic with decreasing relative growth', () => {
    const costs = Array.from({ length: 100 }, (_, index) => getProgression(index + 1).upgradeAura);
    expect(costs.every((cost) => cost > 0)).toBe(true);
    expect(costs.every((cost, index) => index === 0 || cost >= costs[index - 1])).toBe(true);
  });

  it('rounds positive formula results half up and caps at level 100', () => {
    const level100 = getStats(100);
    expect(level100.hp).toBe(roundHalfUp(level100.hp));
    expect(getProgression(101)).toEqual(getProgression(100));
    expect(getStats(0)).toEqual(getStats(1));
  });
});
