import React from 'react';
import type { PlayerState } from '../api/client';

type PlayerStatsPanelProps = { player: PlayerState };

const statLabels: Array<[keyof Pick<PlayerState, 'hp' | 'mp' | 'attack' | 'defense' | 'speed'>, string]> = [
  ['hp', 'HP'],
  ['mp', 'MP'],
  ['attack', '攻击'],
  ['defense', '防御'],
  ['speed', '速度'],
];

export function PlayerStatsPanel({ player }: PlayerStatsPanelProps) {
  return (
    <section aria-label="角色属性">
      <h2>角色属性</h2>
      <p>等级 {player.level}</p>
      <p>境界 {player.realm}</p>
      <p>层数 {player.layer}</p>
      {statLabels.map(([key, label]) => <p key={key}>{label} {player[key]}</p>)}
      <p>暴击 {player.criticalChance}%</p>
      <p>闪避 {player.dodgeChance}%</p>
      <p>{player.isOnline ? '在线' : '离线'}</p>
    </section>
  );
}
