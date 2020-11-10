export enum ErrorType {
  BadRequest,
  Conflict,
}

export type Result<TOk, TError> = OkResult<TOk, TError> | ErrorResult<TOk, TError>;

export type PromiseResult<TOk, TError> = Promise<Result<TOk, TError>>;

class OkResult<TOk, TError> {
  constructor(readonly value: TOk) {}

  isOk(): this is OkResult<TOk, TError> {
    return true;
  }

  isError(): this is ErrorResult<TOk, TError> {
    return false;
  }
}

class ErrorResult<TOk, TError> {
  constructor(readonly error: TError) {}

  isOk(): this is OkResult<TOk, TError> {
    return false;
  }

  isError(): this is ErrorResult<TOk, TError> {
    return true;
  }
}

function createError<TError>(error: TError) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new ErrorResult<any, TError>(error);
}

export const Errors = {
  BadRequest: createError(ErrorType.BadRequest),
  Conflict: createError(ErrorType.Conflict),
};

export function ok<TOk, TError>(value: TOk): OkResult<TOk, TError> {
  return new OkResult(value);
}
