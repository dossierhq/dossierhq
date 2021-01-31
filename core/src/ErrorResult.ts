export enum ErrorType {
  /** Corresponds to 400 Bad Request */
  BadRequest = 'BadRequest',
  /** Corresponds to 409 Conflict */
  Conflict = 'Conflict',
  /** Corresponds to 401 Unauthenticated */
  NotAuthenticated = 'NotAuthenticated',
  /** Corresponds to 404 Not Found */
  NotFound = 'NotFound',
}

export type Result<TOk, TError extends ErrorType> =
  | OkResult<TOk, TError>
  | ErrorResult<unknown, TError>;

export type PromiseResult<TOk, TError extends ErrorType> = Promise<Result<TOk, TError>>;

export class OkResult<TOk, TError extends ErrorType> {
  readonly value: TOk;

  constructor(value: TOk) {
    this.value = value;
  }

  isOk(): this is OkResult<TOk, TError> {
    return true;
  }

  isError(): this is ErrorResult<TOk, TError> {
    return false;
  }

  toError(): Error {
    return new Error('Expected error, but was ok');
  }

  throwIfError(): void {
    // do nothing
  }
}

export class ErrorResult<TOk, TError extends ErrorType> {
  readonly error: TError;
  readonly message: string;

  constructor(error: TError, message: string) {
    this.error = error;
    this.message = message;
  }

  isOk(): this is OkResult<TOk, TError> {
    return false;
  }

  isError(): this is ErrorResult<TOk, TError> {
    return true;
  }

  toError(): Error {
    return new Error(`${this.error}: ${this.message}`);
  }

  throwIfError(): never {
    throw new Error(`${this.error}: ${this.message}`);
  }
}

export function createErrorResult<TError extends ErrorType>(
  error: TError,
  message: string
): ErrorResult<unknown, TError> {
  return new ErrorResult<unknown, TError>(error, message);
}

export function ok<TOk, TError extends ErrorType>(value: TOk): OkResult<TOk, TError> {
  return new OkResult(value);
}

export const notOk = {
  BadRequest: (message: string): ErrorResult<unknown, ErrorType.BadRequest> =>
    createErrorResult(ErrorType.BadRequest, message),
  Conflict: (message: string): ErrorResult<unknown, ErrorType.Conflict> =>
    createErrorResult(ErrorType.Conflict, message),
  NotAuthenticated: (message: string): ErrorResult<unknown, ErrorType.NotAuthenticated> =>
    createErrorResult(ErrorType.NotAuthenticated, message),
  NotFound: (message: string): ErrorResult<unknown, ErrorType.NotFound> =>
    createErrorResult(ErrorType.NotFound, message),
};
