import { describe, expect, it } from 'vitest';

import { buildServer } from '../src/app.js';
import { InMemoryRepository } from '../src/repository.js';
import type { ProgressionRules } from '../src/rules-contract.js';

const rules: ProgressionRules = {
  settle(input) {
    const gainedAuraMilli = input.onlineMilliseconds + input.offlineMilliseconds / 2;
    const auraMilli = input.auraMilli + gainedAuraMilli;
    return {
      auraMilli,
      level: auraMilli >= 1_000 ? 2 : 1,
      breakthroughStatus: auraMilli >= 2_000 ? 'ready' : 'locked',
      nextRequirement: 0,
    };
  },
  breakthrough(player) {
    return {
      auraMilli: player.auraMilli,
      level: player.level,
      breakthroughStatus: 'locked',
      nextRequirement: 0,
    };
  },
};

describe('progression service and API', () => {
  it('settles the online window and then the offline window before returning the player', async () => {
    let now = new Date('2026-08-23T00:00:00.000Z');
    const app = buildServer({ repository: new InMemoryRepository(), rules, now: () => now });
    const register = await app.inject({ method: 'POST', url: '/api/auth/register', payload: { username: 'lin', password: 'correct horse battery staple' } });
    const token = register.json().token as string;
    now = new Date('2026-08-23T00:02:00.000Z');

    const me = await app.inject({ method: 'GET', url: '/api/player/me', headers: { authorization: `Bearer ${token}` } });

    expect(me.statusCode).toBe(200);
    expect(me.json().player).toMatchObject({ level: 2, aura_milli: 105_000, progression_version: 1, breakthrough_status: 'ready', isOnline: false, onlineRate: 1, offlineRate: 0.5 });
    await app.close();
  });

  it('requires authentication, records a heartbeat, and logs out the session', async () => {
    let now = new Date('2026-08-23T00:00:00.000Z');
    const app = buildServer({ repository: new InMemoryRepository(), rules, now: () => now });
    const register = await app.inject({ method: 'POST', url: '/api/auth/register', payload: { username: 'mei', password: 'a secure password' } });
    const token = register.json().token as string;
    now = new Date('2026-08-23T00:00:30.000Z');

    expect((await app.inject({ method: 'POST', url: '/api/session/heartbeat', headers: { authorization: `Bearer ${token}` } })).statusCode).toBe(200);
    expect((await app.inject({ method: 'POST', url: '/api/auth/logout', headers: { authorization: `Bearer ${token}` } })).statusCode).toBe(204);
    expect((await app.inject({ method: 'GET', url: '/api/player/me', headers: { authorization: `Bearer ${token}` } })).statusCode).toBe(401);
    await app.close();
  });

  it('allows browser origins through CORS', async () => {
    const previousOrigin = process.env.CORS_ORIGIN;
    delete process.env.CORS_ORIGIN;
    const app = buildServer({ repository: new InMemoryRepository(), rules });

    try {
      const response = await app.inject({ method: 'OPTIONS', url: '/api/player/me', headers: {
        origin: 'http://localhost:5173', 'access-control-request-method': 'GET',
      } });

      expect(response.statusCode).toBe(204);
      expect(response.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    } finally {
      await app.close();
      if (previousOrigin === undefined) delete process.env.CORS_ORIGIN;
      else process.env.CORS_ORIGIN = previousOrigin;
    }
  });

  it('accepts comma-separated configured CORS origins', async () => {
    const previousOrigin = process.env.CORS_ORIGIN;
    process.env.CORS_ORIGIN = 'http://localhost:5173, http://example.test';
    const app = buildServer({ repository: new InMemoryRepository(), rules });

    try {
      const response = await app.inject({ method: 'OPTIONS', url: '/api/player/me', headers: {
        origin: 'http://example.test', 'access-control-request-method': 'GET',
      } });

      expect(response.statusCode).toBe(204);
      expect(response.headers['access-control-allow-origin']).toBe('http://example.test');
    } finally {
      await app.close();
      if (previousOrigin === undefined) delete process.env.CORS_ORIGIN;
      else process.env.CORS_ORIGIN = previousOrigin;
    }
  });

  it('logs in a registered player and rejects an invalid password', async () => {
    const app = buildServer({ repository: new InMemoryRepository(), rules });
    await app.inject({ method: 'POST', url: '/api/auth/register', payload: { username: 'han', password: 'a secure password' } });

    const login = await app.inject({ method: 'POST', url: '/api/auth/login', payload: { username: 'han', password: 'a secure password' } });
    const rejected = await app.inject({ method: 'POST', url: '/api/auth/login', payload: { username: 'han', password: 'wrong password' } });

    expect(login.statusCode).toBe(200);
    expect(login.json().token).toEqual(expect.any(String));
    expect(rejected.statusCode).toBe(401);
    await app.close();
  });

  it('does not auto-break through, but accepts an explicit breakthrough after settlement', async () => {
    let now = new Date('2026-08-23T00:00:00.000Z');
    const app = buildServer({ repository: new InMemoryRepository(), rules, now: () => now });
    const register = await app.inject({ method: 'POST', url: '/api/auth/register', payload: { username: 'yuan', password: 'a secure password' } });
    const token = register.json().token as string;
    now = new Date('2026-08-23T00:02:00.000Z');

    const status = await app.inject({ method: 'GET', url: '/api/progression/status', headers: { authorization: `Bearer ${token}` } });
    expect(status.json().player.breakthrough_status).toBe('ready');
    const breakthrough = await app.inject({ method: 'POST', url: '/api/progression/breakthrough', headers: { authorization: `Bearer ${token}` } });

    expect(breakthrough.statusCode).toBe(200);
    expect(breakthrough.json().player).toMatchObject({ breakthrough_status: 'locked', progression_version: 2 });
    await app.close();
  });

  it('caps a rule package level result at level 100', async () => {
    let now = new Date('2026-08-23T00:00:00.000Z');
    const app = buildServer({
      repository: new InMemoryRepository(),
      rules: { ...rules, settle: (input) => ({ ...rules.settle(input), level: 101 }) },
      now: () => now,
    });
    const register = await app.inject({ method: 'POST', url: '/api/auth/register', payload: { username: 'max', password: 'a secure password' } });
    now = new Date('2026-08-23T00:00:01.000Z');

    const me = await app.inject({ method: 'GET', url: '/api/player/me', headers: { authorization: `Bearer ${register.json().token as string}` } });

    expect(me.json().player.level).toBe(100);
    await app.close();
  });
});
