import { clampLevel } from './realm.js';

export interface Stats {
  readonly hp: number;
  readonly mp: number;
  readonly attack: number;
  readonly defense: number;
  readonly speed: number;
  readonly criticalRateBps: number;
  readonly evasionRateBps: number;
}

const roundPositive = (value: number): number => Math.max(1, Math.floor(value + 0.5));

export function getStats(level: number): Stats {
  const safeLevel = clampLevel(level);
  const realm = Math.floor((safeLevel - 1) / 10);
  const layer = (safeLevel - 1) % 10;
  const multiplier = Math.pow(1.55, realm) * 100;

  return {
    hp: roundPositive((50 + 6 * layer + 18 * realm) * multiplier),
    mp: roundPositive((30 + 4 * layer + 12 * realm) * multiplier),
    attack: roundPositive((12 + 1.2 * layer + 4 * realm) * multiplier),
    defense: roundPositive((5 + 0.5 * layer + 1.7 * realm) * multiplier),
    speed: roundPositive((10 + layer + 3 * realm) * multiplier),
    criticalRateBps: Math.min(1500, roundPositive((5 + realm) * 100)),
    evasionRateBps: Math.min(800, roundPositive((3 + 0.5 * realm) * 100)),
  };
}
