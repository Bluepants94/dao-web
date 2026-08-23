import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

import type { PlayerRepository } from './repository.js';
import type { Player } from './types.js';

const scrypt = promisify(scryptCallback);

const hashPassword = async (password: string): Promise<string> => {
  const salt = randomBytes(16).toString('hex');
  const digest = await scrypt(password, salt, 64) as Buffer;
  return `${salt}:${digest.toString('hex')}`;
};

const verifyPassword = async (password: string, stored: string): Promise<boolean> => {
  const [salt, expected] = stored.split(':');
  if (!salt || !expected) return false;
  const digest = await scrypt(password, salt, 64) as Buffer;
  return timingSafeEqual(Buffer.from(expected, 'hex'), digest);
};

export class AuthService {
  constructor(private readonly repository: PlayerRepository) {}

  async register(username: string, password: string, now: Date): Promise<{ player: Player; token: string }> {
    if (!/^[a-zA-Z0-9_]{3,32}$/.test(username) || password.length < 8) throw new Error('INVALID_CREDENTIALS');
    const player = await this.repository.createPlayer({ username, passwordHash: await hashPassword(password), now });
    return { player, token: await this.repository.createSession(player.id) };
  }

  async login(username: string, password: string): Promise<{ player: Player; token: string }> {
    const player = await this.repository.findPlayerByUsername(username);
    if (!player || !(await verifyPassword(password, player.passwordHash))) throw new Error('INVALID_LOGIN');
    return { player, token: await this.repository.createSession(player.id) };
  }

  async playerForToken(token: string): Promise<Player | undefined> { return this.repository.findPlayerBySession(token); }
  async logout(token: string): Promise<void> { await this.repository.deleteSession(token); }
}
