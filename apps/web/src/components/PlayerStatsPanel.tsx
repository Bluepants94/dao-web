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
    <section className="panel stats-panel" aria-label="角色属性">
      <div className="panel-heading">
        <h2>角色属性</h2>
        <span className={`status-badge ${player.isOnline ? 'status-online' : 'status-offline'}`}>
          {player.isOnline ? '在线' : '离线'}
        </span>
      </div>
      <div className="realm-summary">
        <div>
          <span className="summary-label">等级摘要</span>
          <strong>等级 {player.level}</strong>
        </div>
        <div>
          <span className="summary-label">境界摘要</span>
          <strong>{player.realm} · 层数 {player.layer}</strong>
        </div>
      </div>
      <div className="stat-grid" aria-label="基础属性">
        <h3>基础属性</h3>
        {statLabels.map(([key, label]) => (
          <div className="stat-card" key={key}>
            <span>{label} </span>
            <strong>{player[key]}</strong>
          </div>
        ))}
      </div>
      <div className="combat-grid" aria-label="战斗属性">
        <h3>战斗属性</h3>
        <div className="stat-card"><span>暴击率 </span><strong>{player.criticalChance}%</strong></div>
        <div className="stat-card"><span>闪避率 </span><strong>{player.dodgeChance}%</strong></div>
      </div>
    </section>
  );
}
