import React, { useCallback, useEffect, useState } from 'react';
import { playerClient, type PlayerState } from '../api/client';
import { MeditationPanel } from '../components/MeditationPanel';
import { PlayerStatsPanel } from '../components/PlayerStatsPanel';
import { useHeartbeat } from '../hooks/useHeartbeat';

type DisplayPlayer = PlayerState & { username?: string };

export function GamePage() {
  const [token, setToken] = useState(() => playerClient.getToken());
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [player, setPlayer] = useState<DisplayPlayer>();
  const [error, setError] = useState<string>();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isBreakingThrough, setIsBreakingThrough] = useState(false);

  const refresh = useCallback(async () => {
    if (!token) return;
    try {
      setError(undefined);
      setPlayer(await playerClient.getState());
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '无法加载角色状态');
    }
  }, [token]);

  useEffect(() => {
    if (token) void refresh();
    else setPlayer(undefined);
  }, [token, refresh]);
  useHeartbeat((state) => setPlayer(state), refresh, Boolean(token));

  const handleAuthentication = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const credentials = {
      username: String(formData.get('username') ?? ''),
      password: String(formData.get('password') ?? ''),
    };

    setIsAuthenticating(true);
    setError(undefined);
    try {
      if (authMode === 'login') await playerClient.login(credentials);
      else await playerClient.register(credentials);
      setToken(playerClient.getToken());
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '认证失败');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleBreakthrough = async () => {
    setIsBreakingThrough(true);
    try {
      await playerClient.breakthrough();
      await refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '突破失败');
    } finally {
      setIsBreakingThrough(false);
    }
  };

  if (!token) {
    return (
      <main className="auth-shell">
        <section className="auth-card" aria-label="身份验证">
          <p className="game-kicker">Cultivation Online</p>
          <h1>修仙文字游戏</h1>
          <p className="game-subtitle">以道心为引，踏上你的修行之路。</p>
          {error && <p className="status-message" role="alert">{error}</p>}
          <form className="auth-form" onSubmit={handleAuthentication}>
            <h2>{authMode === 'login' ? '登录' : '注册'}</h2>
            <label>用户名 <input name="username" placeholder="请输入用户名" required /></label>
            <label>密码 <input name="password" type="password" placeholder="请输入密码" required /></label>
            <div className="auth-form__actions">
              <button className="button-primary" type="submit" disabled={isAuthenticating}>{authMode === 'login' ? '登录' : '注册'}</button>
              <button className="auth-form__toggle" type="button" onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}>
                {authMode === 'login' ? '注册' : '登录'}
              </button>
            </div>
          </form>
        </section>
      </main>
    );
  }

  if (!player) {
    return (
      <main className="loading-shell">
        <div className="loading-orb" aria-hidden="true" />
        {error && <p className="status-message" role="alert">{error}</p>}
        <p className="loading-message" role="status">正在加载角色状态…</p>
      </main>
    );
  }

  return (
    <main className="game-shell">
      <header className="game-header">
        <div className="game-header__copy">
          <p className="game-kicker">Cultivation Online</p>
          <h1>修仙文字游戏</h1>
          <p className="game-subtitle">{player.username ?? '修行者'} · {player.realm} · {player.isOnline ? '在线' : '离线'}</p>
        </div>
        <div className="game-header__mark" aria-hidden="true">道</div>
      </header>
      {error && <p role="alert">{error}</p>}
      <div className="game-layout">
        <PlayerStatsPanel player={player} />
        <MeditationPanel player={player} onBreakthrough={handleBreakthrough} isBreakingThrough={isBreakingThrough} />
      </div>
    </main>
  );
}
