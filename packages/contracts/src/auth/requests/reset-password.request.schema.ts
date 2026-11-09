import { z } from 'zod';

export const resetPasswordRequestSchema = z.object({
  email: z.email(),
  otp: z.string().regex(/^\d{6}$/, 'OTP must be exactly six digits'),
  password: z.string().min(8).max(1024),
});
