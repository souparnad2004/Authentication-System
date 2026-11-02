import type { ApiErrorCode } from '@repo/contracts';
import { AppError } from './AppError.js';

export class BadRequestError extends AppError {
  constructor(message: string, code: ApiErrorCode = 'VALIDATION_ERROR') {
    super(message, 400, code);
  }
}
