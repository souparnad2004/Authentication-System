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
