import { z } from 'zod';

export const registerSchema = z.object({
  username: z.string().trim().min(1),
  email: z.email(),
  password: z.string().min(8).max(1024),
});
