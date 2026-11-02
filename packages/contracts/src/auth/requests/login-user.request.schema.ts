import { z } from 'zod';

const emailSchema = z.email();

export const loginUserRequestSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(1024),
});

export const loginSchema = loginUserRequestSchema;
