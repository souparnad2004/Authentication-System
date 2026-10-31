import { z } from 'zod';

export const uuidSchema = z.uuid();

const emailSchema = z.email();

export const registerUserRequestSchema = z.object({
  username: z.string().trim().min(1),
  email: emailSchema,
  password: z.string().min(8).max(1024),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(1024),
});

export type RegisterUserRequest = z.infer<typeof registerUserRequestSchema>;
export type LoginRequest = z.infer<typeof loginSchema>;
