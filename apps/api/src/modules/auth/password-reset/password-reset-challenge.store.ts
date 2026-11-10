import type { Redis } from 'ioredis';
import type { PasswordResetChallengeRecord } from '../shared/auth.types.js';
import type { PasswordResetChallengeStore } from './password-reset-challenge.store.interface.js';

const CHALLENGE_KEY_PREFIX = 'password-reset:';

const INCREMENT_ATTEMPTS_SCRIPT = `
local challengeId = redis.call('HGET', KEYS[1], 'challengeId')
local attempts = tonumber(redis.call('HGET', KEYS[1], 'attempts'))
local expiresAt = tonumber(redis.call('HGET', KEYS[1], 'expiresAt'))

if not challengeId or challengeId ~= ARGV[1] or not attempts or not expiresAt then
  return 0
end
if attempts >= tonumber(ARGV[2]) or expiresAt <= tonumber(ARGV[3]) then
  return 0
end

return redis.call('HINCRBY', KEYS[1], 'attempts', 1)
`;

const CONSUME_CHALLENGE_SCRIPT = `
local challengeId = redis.call('HGET', KEYS[1], 'challengeId')
local attempts = tonumber(redis.call('HGET', KEYS[1], 'attempts'))
local expiresAt = tonumber(redis.call('HGET', KEYS[1], 'expiresAt'))

if not challengeId or challengeId ~= ARGV[1] or not attempts or not expiresAt then
  return 0
end
if attempts >= tonumber(ARGV[2]) or expiresAt <= tonumber(ARGV[3]) then
  return 0
end

return redis.call('DEL', KEYS[1])
`;

export class RedisPasswordResetChallengeStore implements PasswordResetChallengeStore {
  constructor(private readonly redis: Redis) {}

  async create(input: PasswordResetChallengeRecord): Promise<void> {
    const key = this.getKey(input.userId);
    const ttl = input.expiresAt.getTime() - Date.now();

    if (!Number.isFinite(ttl) || ttl <= 0) {
      throw new Error('Password reset challenge expiry must be in the future');
    }

    const result = await this.redis
      .multi()
      .del(key)
      .hset(key, {
        challengeId: input.id,
        otpHash: input.otpHash,
        expiresAt: String(input.expiresAt.getTime()),
        attempts: String(input.attempts),
      })
      .pexpire(key, ttl)
      .exec();

    if (!result) {
      throw new Error('Failed to store password reset challenge in Redis');
    }

    const commandError = result.find(([error]) => error !== null)?.[0];
    if (commandError) {
      throw commandError;
    }
  }

  async findActive(userId: string, now: Date): Promise<PasswordResetChallengeRecord | undefined> {
    const challenge = await this.redis.hgetall(this.getKey(userId));

    if (Object.keys(challenge).length === 0) {
      return undefined;
    }

    const expiresAt = new Date(Number(challenge.expiresAt));
    const attempts = Number(challenge.attempts);
    if (
      !challenge.challengeId ||
      !challenge.otpHash ||
      !Number.isFinite(expiresAt.getTime()) ||
      !Number.isInteger(attempts) ||
      attempts < 0
    ) {
      throw new Error('Invalid password reset challenge data in Redis');
    }

    if (expiresAt <= now) {
      return undefined;
    }

    return {
      id: challenge.challengeId,
      userId,
      otpHash: challenge.otpHash,
      expiresAt,
      attempts,
    };
  }

  async incrementAttempts(
    userId: string,
    challengeId: string,
    maxAttempts: number,
  ): Promise<boolean> {
    const updatedAttempts = await this.redis.eval(
      INCREMENT_ATTEMPTS_SCRIPT,
      1,
      this.getKey(userId),
      challengeId,
      maxAttempts,
      Date.now(),
    );

    return Number(updatedAttempts) > 0;
  }

  async consume(
    userId: string,
    challengeId: string,
    maxAttempts: number,
    now: Date,
  ): Promise<boolean> {
    const consumed = await this.redis.eval(
      CONSUME_CHALLENGE_SCRIPT,
      1,
      this.getKey(userId),
      challengeId,
      maxAttempts,
      now.getTime(),
    );

    return Number(consumed) === 1;
  }

  private getKey(userId: string): string {
    return `${CHALLENGE_KEY_PREFIX}${userId}`;
  }
}
