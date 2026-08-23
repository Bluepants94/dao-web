export type PlayerState = {
  level: number;
  realm: string;
  layer: number;
  hp: number;
  mp: number;
  attack: number;
  defense: number;
  speed: number;
  criticalChance: number;
  dodgeChance: number;
  isOnline: boolean;
  spiritualEnergy: number;
  onlineEnergyRate: number;
  offlineEnergyRate: number;
  levelProgress: { current: number; required: number };
  breakthrough: { canBreakthrough: boolean; description: string };
};

type PlayerResponse = { player: PlayerState };
type AuthCredentials = { username: string; password: string };
type AuthResponse = { token: string; player: PlayerState };
type RuntimeEnv = { VITE_API_URL?: string };

type FetchResponse = { ok: boolean; status?: number; json: () => Promise<unknown> };

const TOKEN_STORAGE_KEY = 'cultivation.token';
const apiBaseUrl = (import.meta as ImportMeta & { env?: RuntimeEnv }).env?.VITE_API_URL?.replace(/\/$/, '') ?? '';

function getToken(): string | null {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

function requestOptions(options: RequestInit | undefined, authenticated: boolean): RequestInit | undefined {
  const headers: Record<string, string> = {};
  if (options?.headers instanceof Headers) {
    options.headers.forEach((value, key) => { headers[key] = value; });
  } else if (options?.headers) {
    Object.assign(headers, options.headers);
  }

  const token = authenticated ? getToken() : null;
  if (token) headers.Authorization = `Bearer ${token}`;
  if (options?.body && !headers['Content-Type']) headers['Content-Type'] = 'application/json';

  return Object.keys(headers).length > 0 ? { ...options, headers } : options;
}

async function request<T>(path: string, options?: RequestInit, authenticated = true): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, requestOptions(options, authenticated)) as FetchResponse;
  if (!response.ok) {
    throw new Error(`请求失败（${response.status ?? '未知状态'}）`);
  }

  return response.json() as Promise<T>;
}

export const playerClient = {
  getToken,
  login: async (credentials: AuthCredentials) => {
    const result = await request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }, false);
    localStorage.setItem(TOKEN_STORAGE_KEY, result.token);
    return result;
  },
  register: async (credentials: AuthCredentials) => {
    const result = await request<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }, false);
    localStorage.setItem(TOKEN_STORAGE_KEY, result.token);
    return result;
  },
  getState: async () => (await request<PlayerResponse>('/api/progression/status')).player,
  sendHeartbeat: async () => (await request<PlayerResponse>('/api/session/heartbeat', { method: 'POST' })).player,
  breakthrough: async () => (await request<PlayerResponse>('/api/progression/breakthrough', { method: 'POST' })).player,
};
