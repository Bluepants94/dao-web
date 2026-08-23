export interface Realm {
  readonly index: number;
  readonly name: string;
  readonly layer: number;
  readonly startLevel: number;
  readonly endLevel: number;
}

const REALM_NAMES = ['炼气', '筑基', '金丹', '元婴', '化神', '炼虚', '合体', '大乘', '渡劫', '真仙'] as const;

export function clampLevel(level: number): number {
  return Math.min(100, Math.max(1, Math.floor(level)));
}

export function getRealm(level: number): Realm {
  const safeLevel = clampLevel(level);
  const index = Math.floor((safeLevel - 1) / 10);
  return {
    index,
    name: REALM_NAMES[index],
    layer: ((safeLevel - 1) % 10) + 1,
    startLevel: index * 10 + 1,
    endLevel: (index + 1) * 10,
  };
}
