import { clampLevel } from './realm.js';

export function getUpgradeAura(level: number): number {
  const safeLevel = clampLevel(level);
  const realm = Math.floor((safeLevel - 1) / 10);
  return Math.max(1, Math.floor(2 * safeLevel * (safeLevel + 4) * Math.pow(1.12, realm) + 0.5));
}

export function getCumulativeAura(level: number): number {
  const safeLevel = clampLevel(level);
  let total = 0;
  for (let current = 1; current <= safeLevel; current += 1) total += getUpgradeAura(current);
  return total;
}

export function getBreakthroughCost(level: number): number {
  const safeLevel = clampLevel(level);
  return safeLevel % 10 === 0 && safeLevel < 100 ? getUpgradeAura(safeLevel) * 3 : 0;
}
