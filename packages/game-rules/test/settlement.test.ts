import { describe, expect, it } from 'vitest';
import {
  breakthroughProgression,
  getBreakthroughCost,
  getUpgradeAura,
  settleProgression,
  type SettlementInput,
} from '../src/index.js';

const TWELVE_HOURS = 12 * 60 * 60 * 1000;
const milli = (aura: number) => aura * 1000;
const settle = (input: Partial<SettlementInput> & Pick<SettlementInput, 'level'>) => settleProgression({
  auraMilli: 0,
  onlineMilliseconds: 0,
  offlineMilliseconds: 0,
  ...input,
});

describe('progression settlement adapter', () => {
  it('grants one full current-level cost per 12 online hours', () => {
    expect(settle({ level: 1, onlineMilliseconds: TWELVE_HOURS })).toEqual({
      level: 2,
      auraMilli: 0,
      breakthroughStatus: 'locked',
      nextRequirement: milli(getUpgradeAura(2)),
    });
  });

  it('grants half speed offline and combines online and offline time', () => {
    expect(settle({ level: 1, onlineMilliseconds: TWELVE_HOURS / 2, offlineMilliseconds: TWELVE_HOURS })).toMatchObject({
      level: 2,
      auraMilli: 0,
    });
  });

  it('automatically spends ordinary-level costs and can advance multiple levels', () => {
    const result = settle({ level: 1, auraMilli: milli(getUpgradeAura(1) + getUpgradeAura(2)) });

    expect(result.level).toBe(3);
    expect(result.auraMilli).toBe(0);
    expect(result.breakthroughStatus).toBe('locked');
  });

  it('marks a realm gate ready only at cost plus breakthrough cost', () => {
    const required = getUpgradeAura(10) + getBreakthroughCost(10);

    expect(settle({ level: 10, auraMilli: milli(required - 1) })).toMatchObject({
      level: 10,
      breakthroughStatus: 'locked',
      nextRequirement: milli(required),
    });
    expect(settle({ level: 10, auraMilli: milli(required) })).toMatchObject({
      level: 10,
      auraMilli: milli(required),
      breakthroughStatus: 'ready',
      nextRequirement: milli(required),
    });
  });

  it('spends the gate target and enters the next level on breakthrough', () => {
    const required = milli(getUpgradeAura(10) + getBreakthroughCost(10));
    const result = breakthroughProgression({ level: 10, auraMilli: required + 80_000, breakthroughStatus: 'ready' });

    expect(result).toEqual({
      level: 11,
      auraMilli: 80_000,
      breakthroughStatus: 'locked',
      nextRequirement: milli(getUpgradeAura(11)),
    });
  });

  it('caps settlement and breakthrough at level 100', () => {
    const settled = settle({ level: 100, auraMilli: 123_456, onlineMilliseconds: TWELVE_HOURS });
    const brokenThrough = breakthroughProgression({ level: 100, auraMilli: 123_456, breakthroughStatus: 'ready' });

    expect(settled).toEqual({ level: 100, auraMilli: 123_456, breakthroughStatus: 'locked', nextRequirement: 0 });
    expect(brokenThrough).toEqual(settled);
  });
});
