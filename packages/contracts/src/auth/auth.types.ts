import type { z } from 'zod';
import type { loginUserRequestSchema } from './requests/login-user.request.schema.js';
import type { registerUserRequestSchema } from './requests/register-user.request.schema.js';
import type { loginUserResponseSchema } from './responses/login-user.response.schema.js';
import type { registerUserResponseSchema } from './responses/register-user.response.schema.js';
import type { refreshTokenResponseSchema } from './responses/refresh-token.response.schema.js';
import type { registeredUserSchema } from './responses/register-user.response.schema.js';
import type { publicUserSchema } from './responses/login-user.response.schema.js';

export type LoginUserRequest = z.infer<typeof loginUserRequestSchema>;
export type LoginRequest = LoginUserRequest;
export type RegisterUserRequest = z.infer<typeof registerUserRequestSchema>;
export type LoginResponse = z.infer<typeof loginUserResponseSchema>;
export type PublicUser = z.infer<typeof publicUserSchema>;
export type RegisteredUser = z.infer<typeof registeredUserSchema>;
export type RegisterUserResponse = z.infer<typeof registerUserResponseSchema>;
export type RefreshTokenResponse = z.infer<typeof refreshTokenResponseSchema>;
