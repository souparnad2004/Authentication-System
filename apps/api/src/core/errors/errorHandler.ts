import type { ErrorRequestHandler } from 'express';
import type { ApiError } from '@repo/contracts';
import { ZodError } from 'zod';
import { AppError } from './AppError.js';

export const errorHandler: ErrorRequestHandler = (error, _req, res, next) => {
  if (res.headersSent) {
    next(error);
    return;
  }

  if (error instanceof ZodError) {
    const response = {
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request input',
        issues: error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
        requestId: getRequestId(res.locals.requestId),
      },
    } satisfies ApiError;

    res.status(400).json(response);
    return;
  }

  if (error instanceof AppError) {
    const response = {
      error: {
        code: error.code,
        message: error.message,
        requestId: getRequestId(res.locals.requestId),
      },
    } satisfies ApiError;

    res.status(error.statusCode).json(response);
    return;
  }

  console.error('Unhandled API error:', error);
  const response = {
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
      requestId: getRequestId(res.locals.requestId),
    },
  } satisfies ApiError;

  res.status(500).json(response);
};

function getRequestId(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}
