import type { LoggerContext } from './Logger.js';

export const ErrorType = {
  /** Corresponds to 400 Bad Request */
  BadRequest: 'BadRequest',
  /** Corresponds to 409 Conflict */
  Conflict: 'Conflict',
  /** Corresponds to 401 Unauthenticated */
  NotAuthenticated: 'NotAuthenticated',
  /** Corresponds to 403 Forbidden */
  NotAuthorized: 'NotAuthorized',
  /** Corresponds to 404 Not Found */
  NotFound: 'NotFound',
  Generic: 'Generic',
} as const;
export type ErrorType = (typeof ErrorType)[keyof typeof ErrorType];

export type Result<TOk, TError extends ErrorType> =
  | OkResult<TOk, TError>
  | ErrorResult<unknown, TError>;

export type PromiseResult<TOk, TError extends ErrorType> = Promise<Result<TOk, TError>>;

export type OkFromResult<T> = Awaited<T> extends Result<infer TOk, infer _TError> ? TOk : never;
export type ErrorFromResult<T> =
  Awaited<T> extends Result<infer _TOk, infer TError> ? TError : never;

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

  valueOrThrow(): TOk {
    return this.value;
  }

  map<TNewOk, TNewError extends ErrorType>(
    mapper: (value: TOk) => TNewOk,
  ): Result<TNewOk, TNewError> {
    return ok(mapper(this.value));
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
    return new ErrorResultError(this);
  }

  throwIfError(): never {
    throw new ErrorResultError(this);
  }

  valueOrThrow(): never {
    throw new ErrorResultError(this);
  }

  isErrorType<TSubError extends TError>(errorType: TSubError): this is ErrorResult<TOk, TSubError> {
    return this.error === errorType;
  }

  get httpStatus(): number {
    switch (this.error) {
      case ErrorType.BadRequest:
        return 400;
      case ErrorType.NotAuthenticated:
        return 401;
      case ErrorType.NotAuthorized:
        return 403;
      case ErrorType.NotFound:
        return 404;
      case ErrorType.Conflict:
        return 409;
      case ErrorType.Generic:
        return 500;
      default:
        this.error satisfies never;
        return 500;
    }
  }
}

export class ErrorResultError extends Error {
  errorType: ErrorType;
  errorMessage: string;

  constructor(result: ErrorResult<unknown, ErrorType>) {
    super(`${result.error}: ${result.message}`);
    this.name = 'ErrorResultError';
    this.errorType = result.error;
    this.errorMessage = result.message;
  }
}

export function createErrorResult<TError extends ErrorType>(
  error: TError,
  message: string,
): ErrorResult<unknown, TError> {
  return new ErrorResult<unknown, TError>(error, message);
}

export function createErrorResultFromError<TError extends ErrorType | typeof ErrorType.Generic>(
  context: LoggerContext,
  // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
  error: ErrorResultError | unknown,
  expectedErrorTypes: TError[] | null = null,
): ErrorResult<unknown, TError | typeof ErrorType.Generic> {
  // For some reason instanceof ErrorResultError doesn't always work, due to Next.js compilation?
  if (
    error instanceof ErrorResultError ||
    (error instanceof Error && error.constructor.name === 'ErrorResultError')
  ) {
    const e = error as ErrorResultError;
    const errorResult = new ErrorResult(e.errorType, e.errorMessage);
    if (!expectedErrorTypes || expectedErrorTypes.includes(e.errorType as TError)) {
      return errorResult as ErrorResult<unknown, TError | typeof ErrorType.Generic>;
    }
    return notOk.GenericUnexpectedError(errorResult);
  }
  return notOk.GenericUnexpectedException(context, error);
}

export function ok<TOk, TError extends ErrorType>(value: TOk): OkResult<TOk, TError> {
  return new OkResult(value);
}

export const notOk = {
  fromHttpStatus: (status: number, message: string): ErrorResult<unknown, ErrorType> => {
    let errorType;
    if (status === 400) {
      errorType = ErrorType.BadRequest;
    } else if (status === 401) {
      errorType = ErrorType.NotAuthenticated;
    } else if (status === 403) {
      errorType = ErrorType.NotAuthorized;
    } else if (status === 404) {
      errorType = ErrorType.NotFound;
    } else if (status === 409) {
      errorType = ErrorType.Conflict;
    } else {
      errorType = ErrorType.Generic;
    }
    return createErrorResult(errorType, message);
  },
  BadRequest: (message: string): ErrorResult<unknown, typeof ErrorType.BadRequest> =>
    createErrorResult(ErrorType.BadRequest, message),
  Conflict: (message: string): ErrorResult<unknown, typeof ErrorType.Conflict> =>
    createErrorResult(ErrorType.Conflict, message),
  Generic: (message: string): ErrorResult<unknown, typeof ErrorType.Generic> =>
    createErrorResult(ErrorType.Generic, message),
  GenericUnexpectedError: (
    result: ErrorResult<unknown, ErrorType>,
  ): ErrorResult<unknown, typeof ErrorType.Generic> =>
    createErrorResult(ErrorType.Generic, `Unexpected error: ${result.error}: ${result.message}`),
  GenericUnexpectedException: (
    context: LoggerContext,
    error: unknown,
  ): ErrorResult<unknown, typeof ErrorType.Generic> => {
    if (error instanceof Error) {
      //TODO need to decide how to pass errors to Logger
      context.logger.error('Unexpected error', error);
      return createErrorResult(
        ErrorType.Generic,
        `Unexpected exception: ${error.name}: ${error.message}`,
      );
    }
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    return createErrorResult(ErrorType.Generic, `Unexpected exception: ${error}`);
  },
  NotAuthenticated: (message: string): ErrorResult<unknown, typeof ErrorType.NotAuthenticated> =>
    createErrorResult(ErrorType.NotAuthenticated, message),
  NotAuthorized: (message: string): ErrorResult<unknown, typeof ErrorType.NotAuthorized> =>
    createErrorResult(ErrorType.NotAuthorized, message),
  NotFound: (message: string): ErrorResult<unknown, typeof ErrorType.NotFound> =>
    createErrorResult(ErrorType.NotFound, message),
};

// ASSERTIONS

class AssertionError extends Error {
  actual: unknown;
  expected: unknown;

  constructor(actual: unknown, expected: unknown, message: string) {
    super(message);
    this.name = 'AssertionError';
    this.actual = actual;
    this.expected = expected;
  }
}

export function assertOkResult<TOk, TError extends ErrorType>(
  actual: Result<unknown, ErrorType>,
): asserts actual is OkResult<TOk, TError> {
  if (actual.isError()) {
    throw new AssertionError(
      actual,
      undefined,
      `Expected ok, got error ${actual.error}: ${actual.message}`,
    );
  }
}

export function assertErrorResultType(
  actual: Result<unknown, ErrorType>,
  expectedErrorType: ErrorType,
): asserts actual is ErrorResult<unknown, ErrorType> {
  if (!actual.isError()) {
    throw new AssertionError('ok', expectedErrorType, `Expected error, but was ok`);
  }
  if (actual.error !== expectedErrorType) {
    throw new AssertionError(
      actual.error,
      expectedErrorType,
      `Expected error type ${expectedErrorType} but was ${actual.error} (message: ${actual.message})`,
    );
  }
}
