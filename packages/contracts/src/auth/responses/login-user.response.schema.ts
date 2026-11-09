import { z } from 'zod';

export const publicUserSchema = z.object({
  id: z.uuid(),
  username: z.string(),
  email: z.email(),
  status: z.enum(['active', 'inactive', 'deleted', 'locked', 'disabled']),
  emailVerified: z.boolean(),
  createdAt: z.iso.datetime(),
});

export const loginUserResponseSchema = z.object({
  user: publicUserSchema,
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  tokenType: z.literal('Bearer'),
  expiresIn: z.number().int().positive(),
});

export const loginResponseSchema = loginUserResponseSchema;
