export class EmailAlreadyExistsError extends Error {
  constructor() {
    super('Email already registered');
    this.name = 'EmailAlreadyExistsError';
  }
}

export class UsernameAlreadyExistsError extends Error {
  constructor() {
    super('Username already registered');
    this.name = 'UsernameAlreadyExistsError';
  }
}

export class UserNotFoundError extends Error {
  constructor() {
    super('No user exists with this email');
    this.name = 'UserNotFoundError';
  }
}

export class EmailNotVerifiedError extends Error {
  constructor() {
    super(
      'Email is not verified. Email delivery is not configured; request a verification link after it is enabled.',
    );
    this.name = 'EmailNotVerifiedError';
  }
}

export class WrongCredentialsError extends Error {
  constructor() {
    super('Wrong credentials');
    this.name = 'WrongCredentialsError';
  }
}
