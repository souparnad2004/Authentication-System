export interface TokenManagerPort {
  generateToken(payload: Record<string, unknown>, expiresIn?: string): string;
  verifyToken(token: string): Record<string, unknown> | null;
}