import type { PasswordResetChallengeRecord } from '../shared/auth.types.js';

export interface PasswordResetChallengeStore {
  create(input: PasswordResetChallengeRecord): Promise<void>;
  findActive(userId: string, now: Date): Promise<PasswordResetChallengeRecord | undefined>;
  incrementAttempts(userId: string, challengeId: string, maxAttempts: number): Promise<boolean>;
  consume(userId: string, challengeId: string, maxAttempts: number, now: Date): Promise<boolean>;
}
