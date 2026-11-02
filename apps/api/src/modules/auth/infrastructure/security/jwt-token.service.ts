import type { TokenManagerPort } from '../../application/ports/token-manager.port.js';
import * as jwt from 'jsonwebtoken';

export class JwtTokenService implements TokenManagerPort {
  constructor(private readonly secretKey: string) {}

  generateToken(payload: Record<string, unknown>, expiresIn = '15m'): string {
    return jwt.sign(payload, this.secretKey, {
      expiresIn: expiresIn as jwt.SignOptions['expiresIn'],
    });
  }

  verifyToken(token: string): Record<string, unknown> | null {
    try {
      const decoded = jwt.verify(token, this.secretKey);
      return typeof decoded === 'object' && decoded !== null ? decoded : null;
    } catch {
      return null;
    }
  }
}
