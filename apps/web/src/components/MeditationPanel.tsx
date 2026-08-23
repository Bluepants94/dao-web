import React from 'react';
import type { PlayerState } from '../api/client';

type MeditationPanelProps = {
  player: PlayerState;
  onBreakthrough: () => void;
  isBreakingThrough: boolean;
};

export function MeditationPanel({ player, onBreakthrough, isBreakingThrough }: MeditationPanelProps) {
  const { levelProgress, breakthrough } = player;

  return (
    <section aria-label="修炼进度">
      <h2>修炼进度</h2>
      <p>当前灵气 {player.spiritualEnergy}</p>
      <p>在线速度 {player.onlineEnergyRate}</p>
      <p>离线速度 {player.offlineEnergyRate}</p>
      <p>升级进度 {levelProgress.current} / {levelProgress.required}</p>
      <p>突破信息 {breakthrough.description}</p>
      <button type="button" disabled={!breakthrough.canBreakthrough || isBreakingThrough} onClick={onBreakthrough}>
        突破
      </button>
    </section>
  );
}
