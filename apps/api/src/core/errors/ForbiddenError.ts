import type { ApiErrorCode } from '@repo/contracts';
import { AppError } from './AppError.js';

export class ForbiddenError extends AppError {
  constructor(message: string, code: ApiErrorCode = 'FORBIDDEN') {
    super(message, 403, code);
  }
}
