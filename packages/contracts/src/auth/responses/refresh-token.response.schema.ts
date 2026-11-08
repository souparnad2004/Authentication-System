import { z } from 'zod';

export const refreshTokenResponseSchema = z.object({
  accessToken: z.string().min(1),
  tokenType: z.literal('Bearer'),
  expiresIn: z.number().int().positive(),
});
