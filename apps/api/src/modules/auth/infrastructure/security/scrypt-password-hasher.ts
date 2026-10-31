import { randomBytes, scrypt as scryptCallback } from 'node:crypto';
import type { PasswordHasher } from '../../application/ports/password-hasher.port.js';

const saltLength = 16;
const keyLength = 64;

export class ScryptPasswordHasher implements PasswordHasher {
  async hash(password: string): Promise<string> {
    const salt = randomBytes(saltLength);
    const hash = await new Promise<Buffer>((resolve, reject) => {
      scryptCallback(password, salt, keyLength, (error, derivedKey) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(derivedKey);
      });
    });

    return `scrypt$${salt.toString('base64')}$${hash.toString('base64')}`;
  }
}
