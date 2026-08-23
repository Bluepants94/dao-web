import React from 'react';
import type { PlayerState } from '../api/client';

type MeditationPanelProps = {
  player: PlayerState;
  onBreakthrough: () => void;
  isBreakingThrough: boolean;
};

export function MeditationPanel({ player, onBreakthrough, isBreakingThrough }: MeditationPanelProps) {
  const { levelProgress, breakthrough } = player;
  const isCapped = player.level >= 100 || levelProgress.required === 0;
  const progressPercent = isCapped
    ? 100
    : Math.min(100, Math.max(0, (levelProgress.current / levelProgress.required) * 100));

  return (
    <section className="panel meditation-panel" aria-label="修炼进度">
      <div className="panel-heading">
        <div>
          <p className="panel-eyebrow">吐纳周天</p>
          <h2>灵气进度</h2>
        </div>
        <span className={`status-badge ${player.isOnline ? 'status-online' : 'status-offline'}`}>
          {player.isOnline ? '在线' : '离线'}
        </span>
      </div>

      <div className="aura-total">
        <span>当前灵气 <strong>{player.spiritualEnergy}</strong></span>
      </div>

      <div className="rate-grid" aria-label="灵气获取速度">
        <div>
          <span>在线获取</span>
          <strong>{player.onlineEnergyRate} / 分钟</strong>
        </div>
        <div>
          <span>离线获取</span>
          <strong>{player.offlineEnergyRate} / 分钟</strong>
        </div>
      </div>

      <div className="progress-block">
        <div className="progress-block__heading">
          <span>升级进度</span>
          <strong>{isCapped ? '已达当前境界上限' : `${levelProgress.current} / ${levelProgress.required}`}</strong>
        </div>
        <div
          className="progress-track"
          role="progressbar"
          aria-label="等级升级进度"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progressPercent}
          aria-valuetext={isCapped ? '已达当前境界上限' : `${Math.round(progressPercent)}%（${levelProgress.current} / ${levelProgress.required}）`}
        >
          <div className="progress-track__fill" style={{ width: `${progressPercent}%` }} />
        </div>
      </div>

      <div className="breakthrough-block">
        <div>
          <span>突破契机</span>
          <strong>{breakthrough.description}</strong>
        </div>
        <button
          className={breakthrough.canBreakthrough ? 'button-primary button-breakthrough' : undefined}
          type="button"
          disabled={!breakthrough.canBreakthrough || isBreakingThrough}
          onClick={onBreakthrough}
        >
          {isBreakingThrough ? '突破中…' : '突破'}
        </button>
      </div>
    </section>
  );
}
