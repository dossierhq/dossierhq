import type { ErrorResult, ErrorType, OkResult, Result } from '@dossierhq/core';
import { createErrorResult, isFieldValueEqual } from '@dossierhq/core';

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

export function assertTruthy(actual: unknown): asserts actual {
  if (!actual) {
    throw new AssertionError(actual, true, `Expected truthy`);
  }
}

export function assertSame<T>(actual: T, expected: T): void {
  if (actual !== expected) {
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    throw new AssertionError(actual, expected, `Expected same, got ${actual} !== ${expected}`);
  }
}

export function assertNotSame<T>(actual: T, expected: T): void {
  if (actual === expected) {
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    throw new AssertionError(actual, expected, `Expected not same, got ${actual} === ${expected}`);
  }
}

export function assertEquals<T>(actual: T, expected: T): void {
  //TODO need a different name for isFieldValueEqual
  if (!isFieldValueEqual(actual, expected)) {
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    throw new AssertionError(actual, expected, `Expected equals, got ${actual} !== ${expected}`);
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

export function assertErrorResult(
  actual: Result<unknown, ErrorType>,
  expectedErrorType: ErrorType,
  expectedMessage: string,
): asserts actual is ErrorResult<unknown, ErrorType> {
  if (!actual.isError()) {
    throw new AssertionError(
      actual,
      createErrorResult(expectedErrorType, expectedMessage),
      `Expected error, but was ok`,
    );
  }
  const expectedString = `${expectedErrorType}: ${expectedMessage}`;
  const actualString = `${actual.error}: ${actual.message}`;
  assertSame(actualString, expectedString);
}

export function assertResultValue<TOk, TError extends ErrorType>(
  result: Result<TOk, TError>,
  expectedValue: TOk,
): asserts result is OkResult<TOk, TError> {
  assertOkResult(result);
  if (!isFieldValueEqual(result.value, expectedValue)) {
    throw new AssertionError(result.value, expectedValue, `Expected result values to equal`);
  }
}
