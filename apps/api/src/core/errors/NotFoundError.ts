import type { ApiErrorCode } from '@repo/contracts';
import { AppError } from './AppError.js';

export class NotFoundError extends AppError {
  constructor(message: string, code: ApiErrorCode = 'NOT_FOUND') {
    super(message, 404, code);
  }
}
