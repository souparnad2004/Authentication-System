import { z } from 'zod';

export const apiErrorCodeSchema = z.enum([
  'VALIDATION_ERROR',
  'EMAIL_ALREADY_EXISTS',
  'USERNAME_ALREADY_EXISTS',
  'UNAUTHORIZED',
  'FORBIDDEN',
  'NOT_FOUND',
  'CONFLICT',
  'RATE_LIMITED',
  'INVALID_CREDENTIALS',
  'EMAIL_NOT_VERIFIED',
  'INVALID_OR_EXPIRED_TOKEN',
  'INVALID_OR_EXPIRED_CODE',
  'SESSION_EXPIRED',
  'SESSION_REVOKED',
  'MFA_REQUIRED',
  'MFA_INVALID',
  'OAUTH_FAILED',
  'INTERNAL_SERVER_ERROR',
  'INVALID_REFRESH_TOKEN',
  'REFRESH_TOKEN_EXPIRED',
]);

export const validationIssueSchema = z.object({
  field: z.string(),
  message: z.string(),
});

export const apiErrorSchema = z.object({
  error: z.object({
    code: apiErrorCodeSchema,
    message: z.string(),
    issues: z.array(validationIssueSchema).optional(),
    requestId: z.string().optional(),
  }),
});

export type ApiErrorCode = z.infer<typeof apiErrorCodeSchema>;

export type ApiError = z.infer<typeof apiErrorSchema>;
