import { refreshTokenContract } from '@repo/contracts';

export const refreshCookieOptions = (expiresAt: Date) => ({
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: refreshTokenContract.fullPath,
  expires: expiresAt,
});
