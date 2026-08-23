import Fastify, { type FastifyInstance, type FastifyRequest } from 'fastify';
import cors from '@fastify/cors';

import { AuthService } from './auth-service.js';
import { ProgressionService } from './progression-service.js';
import type { PlayerRepository } from './repository.js';
import type { ProgressionRules } from './rules-contract.js';
import { toPublicPlayer, type Player } from './types.js';

export interface AppDependencies { repository: PlayerRepository; rules: ProgressionRules; now?: () => Date; }

const DEFAULT_CORS_ORIGIN = 'http://localhost:5173';

const corsOrigins = (): string[] => {
  const configured = process.env.CORS_ORIGIN?.split(',').map((origin) => origin.trim()).filter(Boolean);
  return configured && configured.length > 0 ? configured : [DEFAULT_CORS_ORIGIN];
};

const credentials = (body: unknown): { username: string; password: string } | undefined => {
  if (!body || typeof body !== 'object') return undefined;
  const { username, password } = body as Record<string, unknown>;
  return typeof username === 'string' && typeof password === 'string' ? { username, password } : undefined;
};

export const buildServer = ({ repository, rules, now = () => new Date() }: AppDependencies): FastifyInstance => {
  const app = Fastify();
  void app.register(cors, { origin: corsOrigins() });
  const auth = new AuthService(repository);
  const progression = new ProgressionService(repository, rules);
  const requirePlayer = async (request: FastifyRequest): Promise<Player | undefined> => {
    const value = request.headers.authorization;
    const token = value?.startsWith('Bearer ') ? value.slice(7) : undefined;
    return token ? auth.playerForToken(token) : undefined;
  };
  const authenticated = async (request: FastifyRequest, reply: { code: (status: number) => { send: (payload: unknown) => unknown } }) => {
    const player = await requirePlayer(request);
    if (!player) { reply.code(401).send({ error: 'UNAUTHORIZED' }); return undefined; }
    return player;
  };

  app.post('/api/auth/register', async (request, reply) => {
    const input = credentials(request.body);
    if (!input) return reply.code(400).send({ error: 'INVALID_CREDENTIALS' });
    try {
      const result = await auth.register(input.username, input.password, now());
      return reply.code(201).send({ token: result.token, player: toPublicPlayer(result.player, now(), rules.describe?.(result.player)) });
    } catch (error) {
      return reply.code((error as Error).message === 'USERNAME_TAKEN' ? 409 : 400).send({ error: (error as Error).message });
    }
  });
  app.post('/api/auth/login', async (request, reply) => {
    const input = credentials(request.body);
    if (!input) return reply.code(400).send({ error: 'INVALID_CREDENTIALS' });
    try {
      const result = await auth.login(input.username, input.password);
      return { token: result.token, player: toPublicPlayer(result.player, now(), rules.describe?.(result.player)) };
    } catch { return reply.code(401).send({ error: 'INVALID_LOGIN' }); }
  });
  app.post('/api/auth/logout', async (request, reply) => {
    const player = await authenticated(request, reply); if (!player) return;
    await auth.logout(request.headers.authorization!.slice(7));
    return reply.code(204).send();
  });
  app.get('/api/player/me', async (request, reply) => {
    const player = await authenticated(request, reply); if (!player) return;
    const settled = await progression.settle(player.id, now());
    return { player: toPublicPlayer(settled, now(), rules.describe?.(settled)) };
  });
  app.get('/api/progression/status', async (request, reply) => {
    const player = await authenticated(request, reply); if (!player) return;
    const settled = await progression.settle(player.id, now());
    return { player: toPublicPlayer(settled, now(), rules.describe?.(settled)) };
  });
  app.post('/api/session/heartbeat', async (request, reply) => {
    const player = await authenticated(request, reply); if (!player) return;
    const heartbeated = await progression.heartbeat(player.id, now());
    return { player: toPublicPlayer(heartbeated, now(), rules.describe?.(heartbeated)) };
  });
  app.post('/api/progression/breakthrough', async (request, reply) => {
    const player = await authenticated(request, reply); if (!player) return;
    try {
      const brokenThrough = await progression.breakthrough(player.id, now());
      return { player: toPublicPlayer(brokenThrough, now(), rules.describe?.(brokenThrough)) };
    }
    catch (error) { return reply.code(409).send({ error: (error as Error).message }); }
  });
  return app;
};
