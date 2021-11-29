import type { Result } from '.';
import { createErrorResultFromError, ErrorType, notOk, ok } from '.';
import { createMockLogger, expectErrorResult, expectOkResult } from './CoreTestUtils';

describe('createErrorResultFromError()', () => {
  test('From generic error', () => {
    const logger = createMockLogger();
    const actual: Result<unknown, ErrorType.Generic> = createErrorResultFromError(
      { logger },
      new Error('Generic error message')
    );
    expectErrorResult(
      actual,
      ErrorType.Generic,
      'Unexpected exception: Error: Generic error message'
    );
    expect(logger.error.mock.calls).toMatchInlineSnapshot(`
      Array [
        Array [
          "Unexpected error",
          [Error: Generic error message],
        ],
      ]
    `);
  });

  test('From generic error with expected types', () => {
    const logger = createMockLogger();
    const actual: Result<unknown, ErrorType.NotFound | ErrorType.Generic> =
      createErrorResultFromError({ logger }, new Error('Generic error message'), [
        ErrorType.NotFound,
      ]);
    expectErrorResult(
      actual,
      ErrorType.Generic,
      'Unexpected exception: Error: Generic error message'
    );
    expect(logger.error.mock.calls).toMatchInlineSnapshot(`
      Array [
        Array [
          "Unexpected error",
          [Error: Generic error message],
        ],
      ]
    `);
  });

  test('From ErrorResultError without expected types', () => {
    const logger = createMockLogger();
    const actual: Result<unknown, ErrorType> = createErrorResultFromError(
      { logger },
      notOk.Conflict('Conflict error message').toError()
    );
    expectErrorResult(actual, ErrorType.Conflict, 'Conflict error message');
    expect(logger.error.mock.calls).toMatchInlineSnapshot(`Array []`);
  });

  test('From ErrorResultError with supported type', () => {
    const logger = createMockLogger();
    const actual: Result<unknown, ErrorType.Conflict | ErrorType.Generic> =
      createErrorResultFromError({ logger }, notOk.Conflict('Conflict error message').toError(), [
        ErrorType.Conflict,
      ]);
    expectErrorResult(actual, ErrorType.Conflict, 'Conflict error message');
    expect(logger.error.mock.calls).toMatchInlineSnapshot(`Array []`);
  });

  test('From ErrorResultError with unsupported type', () => {
    const logger = createMockLogger();
    const actual: Result<unknown, ErrorType.Conflict | ErrorType.Generic> =
      createErrorResultFromError(
        { logger },
        notOk.BadRequest('Bad request error message').toError(),
        [ErrorType.Conflict]
      );
    expectErrorResult(
      actual,
      ErrorType.Generic,
      'Unexpected error: BadRequest: Bad request error message'
    );
    expect(logger.error.mock.calls).toMatchInlineSnapshot(`Array []`);
  });
});

describe('ErrorResult', () => {
  test('assign error results with compatible ErrorTypes but incompatible TOk types', () => {
    const a: Result<number, ErrorType.BadRequest> = notOk.BadRequest('Hello');
    const b: Result<{ foo: number }, ErrorType.BadRequest> = a;
    expectErrorResult(b, ErrorType.BadRequest, 'Hello');
  });

  test('isErrorType() narrows error type union', () => {
    const a: Result<number, ErrorType.BadRequest | ErrorType.Conflict> = notOk.Conflict('Hello');
    if (a.isError() && a.isErrorType(ErrorType.Conflict)) {
      const b: Result<number, ErrorType.Conflict> = a;
      expectErrorResult(b, ErrorType.Conflict, 'Hello');
    }
  });
});

describe('OkResult', () => {
  test('map(number => string)', () => {
    const result: Result<number, ErrorType.Conflict> = ok(123);
    const mappedResult: Result<string, ErrorType.Conflict> = result.map((value) => String(value));
    if (expectOkResult(mappedResult)) {
      expect(mappedResult.value).toBe('123');
    }
  });

  test('map(object => object)', () => {
    const result: Result<{ foo: 'bar' }, ErrorType.Conflict> = ok({ foo: 'bar' });
    const mappedResult: Result<{ baz: string }, ErrorType.Conflict> = result.map(({ foo }) => ({
      baz: foo.toUpperCase(),
    }));
    if (expectOkResult(mappedResult)) {
      expect(mappedResult.value).toEqual({ baz: 'BAR' });
    }
  });
});

describe('notOk', () => {
  test('GenericUnexpectedException', () => {
    const logger = createMockLogger();
    expectErrorResult(
      notOk.GenericUnexpectedException({ logger }, new Error('Hello world')),
      ErrorType.Generic,
      'Unexpected exception: Error: Hello world'
    );
    expect(logger.error.mock.calls).toMatchInlineSnapshot(`
      Array [
        Array [
          "Unexpected error",
          [Error: Hello world],
        ],
      ]
    `);
  });

  test('GenericUnexpectedException with non-Error', () => {
    const logger = createMockLogger();
    expectErrorResult(
      notOk.GenericUnexpectedException({ logger }, 123),
      ErrorType.Generic,
      'Unexpected exception: 123'
    );
    expect(logger.error.mock.calls).toMatchInlineSnapshot(`Array []`);
  });
});
