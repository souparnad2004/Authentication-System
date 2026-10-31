import type { Email } from '../value-objects/email.vo.js';

export class User {
  private constructor(
    public readonly id: string,
    public readonly username: string,
    public readonly email: Email,
    public readonly passwordHash: string,
  ) {}

  static create(data: { id: string; username: string; email: Email; passwordHash: string }) {
    return new User(data.id, data.username, data.email, data.passwordHash);
  }
}
