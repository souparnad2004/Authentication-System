import type { ApiErrorCode } from '@repo/contracts';
import { AppError } from './AppError.js';

export class UnauthorizedError extends AppError {
  constructor(message: string, code: ApiErrorCode = 'UNAUTHORIZED') {
    super(message, 401, code);
  }
}
