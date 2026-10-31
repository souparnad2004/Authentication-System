import argon2 from 'argon2';
import type { PasswordHasher } from '../../application/ports/password-hasher.port.js';

export class Argon2PasswordHasher implements PasswordHasher {
  async hash(password: string): Promise<string> {
    const hash = await argon2.hash(password, {
      type: argon2.argon2id,
    });

    return hash;
  }

  async verify(password: string, hash: string): Promise<boolean> {
    return argon2.verify(hash, password);
  }
}
