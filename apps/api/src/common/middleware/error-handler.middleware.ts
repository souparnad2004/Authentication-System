import type { ErrorRequestHandler } from 'express';
import type { ApiError } from '@repo/contracts';
import { ZodError } from 'zod';
import {
  EmailAlreadyExistsError,
  EmailNotVerifiedError,
  UsernameAlreadyExistsError,
  UserNotFoundError,
  WrongCredentialsError,
} from '../../modules/auth/domain/errors/identity.errors.js';
import { InvalidEmailError } from '../../modules/auth/domain/value-objects/email.vo.js';

export const errorHandler: ErrorRequestHandler = (error, _req, res, next) => {
  if (res.headersSent) {
    next(error);
    return;
  }

  if (error instanceof ZodError || error instanceof InvalidEmailError) {
    const issues =
      error instanceof ZodError
        ? error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
          }))
        : [{ field: 'email', message: error.message }];

    const response = {
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request input',
        issues,
      },
    } satisfies ApiError;

    res.status(400).json(response);
    return;
  }

  if (error instanceof EmailAlreadyExistsError) {
    sendError(res, 409, 'EMAIL_ALREADY_EXISTS', error.message);
    return;
  }

  if (error instanceof UsernameAlreadyExistsError) {
    sendError(res, 409, 'USERNAME_ALREADY_EXISTS', error.message);
    return;
  }

  if (error instanceof UserNotFoundError) {
    sendError(res, 404, 'NOT_FOUND', error.message);
    return;
  }

  if (error instanceof WrongCredentialsError) {
    sendError(res, 401, 'INVALID_CREDENTIALS', error.message);
    return;
  }

  if (error instanceof EmailNotVerifiedError) {
    sendError(res, 403, 'EMAIL_NOT_VERIFIED', error.message);
    return;
  }

  console.error('Unhandled API error:', error);
  sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Internal server error');
};

function sendError(
  res: Parameters<ErrorRequestHandler>[2],
  status: number,
  code: ApiError['error']['code'],
  message: string,
): void {
  const response = {
    error: { code, message },
  } satisfies ApiError;

  res.status(status).json(response);
}
