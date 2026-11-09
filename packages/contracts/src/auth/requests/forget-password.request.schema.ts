import { z } from 'zod';

export const forgetPasswordRequestSchema = z.object({
  email: z.email(),
});