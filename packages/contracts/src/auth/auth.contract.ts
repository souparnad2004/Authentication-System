import { loginUserResponseSchema } from './responses/login-user.response.schema.js';
import { registerUserResponseSchema } from './responses/register-user.response.schema.js';
import { loginUserRequestSchema } from './requests/login-user.request.schema.js';
import { registerUserRequestSchema } from './requests/register-user.request.schema.js';
import { refreshTokenResponseSchema } from './responses/refresh-token.response.schema.js';
import { forgetPasswordRequestSchema } from './requests/forget-password.request.schema.js';
import { resetPasswordRequestSchema } from './requests/reset-password.request.schema.js';

export const authBasePath = '/api/auth';

export const registerUserContract = {
  method: 'POST',
  path: '/register',
  fullPath: `${authBasePath}/register`,
  status: 201,
  requestSchema: registerUserRequestSchema,
  responseSchema: registerUserResponseSchema,
} as const;

export const loginUserContract = {
  method: 'POST',
  path: '/login',
  fullPath: `${authBasePath}/login`,
  status: 200,
  requestSchema: loginUserRequestSchema,
  responseSchema: loginUserResponseSchema,
} as const;

export const refreshTokenContract = {
  method: 'POST',
  path: '/refresh-token',
  fullPath: `${authBasePath}/refresh-token`,
  status: 200,
  responseSchema: refreshTokenResponseSchema,
} as const;

export const forgetPasswordContract = {
  method: 'POST',
  path: '/forget-password',
  fullPath: `${authBasePath}/forget-password`,
  status: 202,
  requestSchema: forgetPasswordRequestSchema,
} as const;

export const resetPasswordContract = {
  method: 'POST',
  path: '/reset-password',
  fullPath: `${authBasePath}/reset-password`,
  status: 200,
  requestSchema: resetPasswordRequestSchema,
} as const;
