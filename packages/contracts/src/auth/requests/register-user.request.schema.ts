import { z } from 'zod';

const emailSchema = z.email();

export const registerUserRequestSchema = z.object({
  username: z.string().trim().min(1),
  email: emailSchema,
  password: z.string().min(8).max(1024),
});
