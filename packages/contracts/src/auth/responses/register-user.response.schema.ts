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
