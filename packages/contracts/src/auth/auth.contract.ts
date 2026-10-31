import { registerUserResponseSchema } from './auth-response.schema.js';
import { registerUserRequestSchema } from './auth.schema.js';

export const authBasePath = '/api/auth';

export const registerUserContract = {
  method: 'POST',
  path: '/register',
  fullPath: `${authBasePath}/register`,
  status: 201,
  requestSchema: registerUserRequestSchema,
  responseSchema: registerUserResponseSchema,
} as const;
