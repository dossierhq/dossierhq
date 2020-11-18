export enum ErrorType {
  BadRequest = 'BadRequest',
  Conflict = 'Conflict',
  NotFound = 'NotFound',
}

export type Result<TOk, TError extends ErrorType> =
  | OkResult<TOk, TError>
  | ErrorResult<unknown, TError>;

export type PromiseResult<TOk, TError extends ErrorType> = Promise<Result<TOk, TError>>;

export class OkResult<TOk, TError extends ErrorType> {
  constructor(readonly value: TOk) {}

  isOk(): this is OkResult<TOk, TError> {
    return true;
  }

  isError(): this is ErrorResult<TOk, TError> {
    return false;
  }

  asError(): Error {
    return new Error('Expected error, but was ok');
  }

  throwIfError(): void {
    // do nothing
  }
}

export class ErrorResult<TOk, TError extends ErrorType> {
  constructor(readonly error: TError, readonly message: string) {}

  isOk(): this is OkResult<TOk, TError> {
    return false;
  }

  isError(): this is ErrorResult<TOk, TError> {
    return true;
  }

  asError(): Error {
    return new Error(`${this.error}: ${this.message}`);
  }

  throwIfError(): never {
    throw new Error(`${this.error}: ${this.message}`);
  }
}

function createError<TError extends ErrorType>(error: TError, message: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new ErrorResult<any, TError>(error, message);
}

export function ok<TOk, TError extends ErrorType>(value: TOk): OkResult<TOk, TError> {
  return new OkResult(value);
}

export const notOk = {
  BadRequest: (message: string): ErrorResult<unknown, ErrorType.BadRequest> =>
    createError(ErrorType.BadRequest, message),
  Conflict: (message: string): ErrorResult<unknown, ErrorType.Conflict> =>
    createError(ErrorType.Conflict, message),
  NotFound: (message: string): ErrorResult<unknown, ErrorType.NotFound> =>
    createError(ErrorType.NotFound, message),
};
