import type { ApiErrorCode } from '@repo/contracts';

export abstract class AppError extends Error {
  protected constructor(
    message: string,
    public readonly statusCode: number,
    public readonly code: ApiErrorCode,
  ) {
    super(message);
    this.name = new.target.name;
  }
}
