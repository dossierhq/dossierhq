export class NotAuthenticatedError extends Error {
  name = 'NotAuthenticatedError';
  constructor(message = 'Not authenticated') {
    super(message);
  }
}
