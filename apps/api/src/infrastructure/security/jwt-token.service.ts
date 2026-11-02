import * as jwt from 'jsonwebtoken';


export interface TokenManager {
  generateToken(payload: Record<string, unknown>, expiresIn?: string): string;
}


export class JwtTokenService implements TokenManager {
  constructor(private readonly secretKey: string) {}

  generateToken(payload: Record<string, unknown>, expiresIn = '15m'): string {
    return jwt.sign(payload, this.secretKey, {
      expiresIn: expiresIn as jwt.SignOptions['expiresIn'],
    });
  }
}
