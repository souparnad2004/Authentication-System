import { z } from 'zod';

export const registeredUserSchema = z
  .object({
    id: z.uuid(),
    username: z.string(),
    email: z.email(),
  })
  .strict();

export const registerUserResponseSchema = z
  .object({
    message: z.literal('Registration successful'),
    data: registeredUserSchema,
  })
  .strict();

export const publicUserSchema = z.object({
  id: z.uuid(),
  email: z.email(),
  emailVerified: z.boolean(),
  createdAt: z.date(),
});

/**
 * Response returned after successful login.
 */
export const loginResponseSchema = z.object({
  user: publicUserSchema,

  accessToken: z.string().min(1),

  tokenType: z.literal('Bearer'),

  expiresIn: z.number().int().positive(),
});

export type LoginResponse = z.infer<typeof loginResponseSchema>;

export type PublicUser = z.infer<typeof publicUserSchema>;

export type RegisteredUser = z.infer<typeof registeredUserSchema>;

export type RegisterUserResponse = z.infer<typeof registerUserResponseSchema>;
