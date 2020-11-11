export enum ErrorType {
  BadRequest = 'BadRequest',
  Conflict = 'Conflict',
  NotFound = 'NotFound',
}

export type Result<TOk, TError extends ErrorType> =
  | OkResult<TOk, TError>
  | ErrorResult<TOk, TError>;

export type PromiseResult<TOk, TError extends ErrorType> = Promise<Result<TOk, TError>>;

class OkResult<TOk, TError extends ErrorType> {
  constructor(readonly value: TOk) {}

  isOk(): this is OkResult<TOk, TError> {
    return true;
  }

  isError(): this is ErrorResult<TOk, TError> {
    return false;
  }
}

class ErrorResult<TOk, TError extends ErrorType> {
  constructor(readonly error: TError) {}

  isOk(): this is OkResult<TOk, TError> {
    return false;
  }

  isError(): this is ErrorResult<TOk, TError> {
    return true;
  }
}

function createError<TError extends ErrorType>(error: TError) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new ErrorResult<any, TError>(error);
}

export const Errors = {
  BadRequest: createError(ErrorType.BadRequest),
  Conflict: createError(ErrorType.Conflict),
  NotFound: createError(ErrorType.NotFound),
};

export function ok<TOk, TError extends ErrorType>(value: TOk): OkResult<TOk, TError> {
  return new OkResult(value);
}
