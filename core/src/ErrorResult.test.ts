import type { Result } from '.';
import { createErrorResultFromError, ErrorType, notOk } from '.';
import { expectErrorResult } from './CoreTestUtils';

describe('createErrorResultFromError()', () => {
  test('From generic error', () => {
    const actual: Result<unknown, ErrorType.Generic> = createErrorResultFromError(
      new Error('Generic error message')
    );
    expectErrorResult(actual, ErrorType.Generic, 'Generic error message');
  });

  test('From generic error with expected types', () => {
    const actual: Result<
      unknown,
      ErrorType.NotFound | ErrorType.Generic
    > = createErrorResultFromError(new Error('Generic error message'), [ErrorType.NotFound]);
    expectErrorResult(actual, ErrorType.Generic, 'Generic error message');
  });

  test('From ErrorResultError without expected types', () => {
    const actual: Result<unknown, ErrorType> = createErrorResultFromError(
      notOk.Conflict('Conflict error message').toError()
    );
    expectErrorResult(actual, ErrorType.Conflict, 'Conflict error message');
  });

  test('From ErrorResultError with supported type', () => {
    const actual: Result<
      unknown,
      ErrorType.Conflict | ErrorType.Generic
    > = createErrorResultFromError(notOk.Conflict('Conflict error message').toError(), [
      ErrorType.Conflict,
    ]);
    expectErrorResult(actual, ErrorType.Conflict, 'Conflict error message');
  });

  test('From ErrorResultError with unsupported type', () => {
    const actual: Result<
      unknown,
      ErrorType.Conflict | ErrorType.Generic
    > = createErrorResultFromError(notOk.BadRequest('Bad request error message').toError(), [
      ErrorType.Conflict,
    ]);
    expectErrorResult(actual, ErrorType.Generic, 'BadRequest: Bad request error message');
  });
});
