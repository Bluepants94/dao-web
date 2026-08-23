// @vitest-environment jsdom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { playerClient } from '../src/api/client';
import { GamePage } from '../src/pages/GamePage';
import { useHeartbeat } from '../src/hooks/useHeartbeat';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const player = {
  level: 12,
  realm: '筑基',
  layer: 3,
  hp: 10540,
  mp: 6510,
  attack: 2480,
  defense: 1039,
  speed: 2015,
  criticalChance: 12,
  dodgeChance: 8,
  isOnline: true,
  spiritualEnergy: 480,
  onlineEnergyRate: 10,
  offlineEnergyRate: 4,
  levelProgress: { current: 480, required: 1000 },
  breakthrough: { canBreakthrough: true, description: '可突破至筑基四层' },
};

function HookHarness({ onHeartbeat, refresh }: { onHeartbeat: (state: typeof player) => void; refresh: () => Promise<void> }) {
  useHeartbeat(onHeartbeat, refresh);
  return null;
}

describe('GamePage', () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

  beforeEach(() => {
    localStorage.clear();
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('renders all server-provided player statistics and cultivation progress', async () => {
    localStorage.setItem('cultivation.token', 'test-token');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ player }) }));

    await act(async () => root.render(<GamePage />));

    expect(container.querySelector('[aria-label="角色属性"]')).not.toBeNull();
    expect(container.textContent).toContain('等级摘要');
    expect(container.textContent).toContain('境界摘要');
    expect(container.textContent).toContain('在线');
    expect(container.textContent).toContain('基础属性');
    expect(container.textContent).toContain('战斗属性');
    expect(container.textContent).toContain('暴击率 12%');
    expect(container.textContent).toContain('闪避率 8%');

    expect(container.textContent).toContain('等级 12');
    expect(container.textContent).toContain('筑基');
    expect(container.textContent).toContain('HP 10540');
    expect(container.textContent).toContain('MP 6510');
    expect(container.textContent).toContain('攻击 2480');
    expect(container.textContent).toContain('防御 1039');
    expect(container.textContent).toContain('速度 2015');
    expect(container.textContent).toContain('暴击率 12%');
    expect(container.textContent).toContain('闪避率 8%');
    expect(container.textContent).toContain('当前灵气 480');
    expect(container.textContent).toContain('灵气进度');
    expect(container.textContent).toContain('在线获取');
    expect(container.textContent).toContain('离线获取');
    expect(container.textContent).toContain('480 / 1000');
    expect(container.textContent).toContain('可突破至筑基四层');
    const breakthroughButton = container.querySelector<HTMLButtonElement>('button');
    expect(breakthroughButton?.textContent).toBe('突破');
    expect(breakthroughButton?.disabled).toBe(false);
    expect(container.textContent).not.toContain('开始打坐');
    expect(container.textContent).not.toContain('停止打坐');
  });

  it('keeps the breakthrough button disabled when a breakthrough is unavailable', async () => {
    localStorage.setItem('cultivation.token', 'test-token');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        player: {
          ...player,
          breakthrough: { canBreakthrough: false, description: '灵气不足，无法突破' },
        },
      }),
    }));

    await act(async () => root.render(<GamePage />));

    expect(container.querySelector<HTMLButtonElement>('button')?.disabled).toBe(true);
    expect(container.textContent).toContain('灵气不足，无法突破');
  });

  it('requests a breakthrough and refreshes state after the button is pressed', async () => {
    localStorage.setItem('cultivation.token', 'test-token');
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ player }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ player }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ player: { ...player, layer: 4 } }) });
    vi.stubGlobal('fetch', fetchMock);

    await act(async () => root.render(<GamePage />));
    await act(async () => container.querySelector('button')?.dispatchEvent(new MouseEvent('click', { bubbles: true })));

    expect(fetchMock).toHaveBeenNthCalledWith(2, '/api/progression/breakthrough', expect.objectContaining({ method: 'POST' }));
    expect(container.textContent).toContain('层数 4');
  });

  it('shows an authentication form without a token and loads state after login', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ token: 'new-token', player }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ player }) });
    vi.stubGlobal('fetch', fetchMock);

    await act(async () => root.render(<GamePage />));

    expect(container.textContent).toContain('登录');
    const form = container.querySelector('form');
    expect(form).not.toBeNull();
    (form?.querySelector('[name="username"]') as HTMLInputElement).value = 'alice';
    (form?.querySelector('[name="password"]') as HTMLInputElement).value = 'secret';
    await act(async () => form?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));

    expect(localStorage.getItem('cultivation.token')).toBe('new-token');
    expect(fetchMock).toHaveBeenNthCalledWith(1, '/api/auth/login', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ username: 'alice', password: 'secret' }),
    }));
    expect(container.textContent).toContain('alice · 筑基 · 在线');
    expect(container.textContent).toContain('等级 12');
  });

  it('renders an accessible authentication card with credential hints and a mode toggle', async () => {
    await act(async () => root.render(<GamePage />));

    expect(container.querySelector('section.auth-card[aria-label="身份验证"]')).not.toBeNull();
    expect(container.querySelector<HTMLInputElement>('input[name="username"]')?.placeholder).toBe('请输入用户名');
    expect(container.querySelector<HTMLInputElement>('input[name="password"]')?.placeholder).toBe('请输入密码');
    expect(container.querySelector<HTMLButtonElement>('button[type="button"]')?.textContent).toBe('注册');
  });

  it('keeps the authentication form available when login fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 401, json: async () => ({}) }));

    await act(async () => root.render(<GamePage />));

    const form = container.querySelector('form');
    await act(async () => form?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));

    expect(container.querySelector('[role="alert"]')?.textContent).toContain('请求失败（401）');
    expect(container.querySelector('form')).not.toBeNull();
  });

  it('shows the loading shell while the player state is loading', async () => {
    localStorage.setItem('cultivation.token', 'test-token');
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(new Promise(() => undefined)));

    await act(async () => root.render(<GamePage />));

    expect(container.querySelector('main.loading-shell')).not.toBeNull();
    expect(container.querySelector('.loading-orb')).not.toBeNull();
    expect(container.querySelector('[role="status"]')?.textContent).toContain('正在加载角色状态');
  });
});

describe('useHeartbeat', () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.setItem('cultivation.token', 'test-token');
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.useRealTimers();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('uses the heartbeat state and sends heartbeat before focus refresh', async () => {
    const events: string[] = [];
    const onHeartbeat = vi.fn((state: typeof player) => events.push(`heartbeat:${state.isOnline}`));
    const refresh = vi.fn(async () => { events.push('refresh'); });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ player }) }));

    await act(async () => root.render(<HookHarness onHeartbeat={onHeartbeat} refresh={refresh} />));
    await act(async () => vi.advanceTimersByTimeAsync(30_000));

    expect(onHeartbeat).toHaveBeenCalledWith(player);
    expect(refresh).not.toHaveBeenCalled();
    events.length = 0;

    await act(async () => {
      window.dispatchEvent(new Event('focus'));
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(events).toEqual(['heartbeat:true', 'refresh']);
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(fetch).toHaveBeenLastCalledWith('/api/session/heartbeat', {
      method: 'POST',
      headers: { Authorization: 'Bearer test-token' },
    });
  });
});

describe('playerClient authentication', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('adds the stored bearer token to state and breakthrough requests', async () => {
    localStorage.setItem('cultivation.token', 'stored-token');
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ player }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ player }) });
    vi.stubGlobal('fetch', fetchMock);

    await playerClient.getState();
    await playerClient.breakthrough();

    expect(fetchMock).toHaveBeenNthCalledWith(1, '/api/progression/status', {
      headers: { Authorization: 'Bearer stored-token' },
    });
    expect(fetchMock).toHaveBeenNthCalledWith(2, '/api/progression/breakthrough', {
      method: 'POST',
      headers: { Authorization: 'Bearer stored-token' },
    });
  });
});
