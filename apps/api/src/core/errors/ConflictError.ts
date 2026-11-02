import type { ApiErrorCode } from '@repo/contracts';
import { AppError } from './AppError.js';

export class ConflictError extends AppError {
  constructor(message: string, code: ApiErrorCode = 'CONFLICT') {
    super(message, 409, code);
  }
}
