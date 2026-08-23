import React, { useCallback, useEffect, useState } from 'react';
import { playerClient, type PlayerState } from '../api/client';
import { MeditationPanel } from '../components/MeditationPanel';
import { PlayerStatsPanel } from '../components/PlayerStatsPanel';
import { useHeartbeat } from '../hooks/useHeartbeat';

export function GamePage() {
  const [token, setToken] = useState(() => playerClient.getToken());
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [player, setPlayer] = useState<PlayerState>();
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
      <main>
        <h1>修仙文字游戏</h1>
        {error && <p role="alert">{error}</p>}
        <form onSubmit={handleAuthentication}>
          <h2>{authMode === 'login' ? '登录' : '注册'}</h2>
          <label>用户名 <input name="username" required /></label>
          <label>密码 <input name="password" type="password" required /></label>
          <button type="submit" disabled={isAuthenticating}>{authMode === 'login' ? '登录' : '注册'}</button>
          <button type="button" onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}>
            {authMode === 'login' ? '注册' : '登录'}
          </button>
        </form>
      </main>
    );
  }

  if (!player) {
    return <main><p role="status">{error ?? '正在加载角色状态…'}</p></main>;
  }

  return (
    <main className="game-page">
      <h1>修仙文字游戏</h1>
      {error && <p role="alert">{error}</p>}
      <PlayerStatsPanel player={player} />
      <MeditationPanel player={player} onBreakthrough={handleBreakthrough} isBreakingThrough={isBreakingThrough} />
    </main>
  );
}
