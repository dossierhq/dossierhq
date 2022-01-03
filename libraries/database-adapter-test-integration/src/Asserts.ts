import type { ErrorType, OkResult, Result } from '@jonasb/datadata-core';
import { isFieldValueEqual } from '@jonasb/datadata-core';

class AssertionError extends Error {
  actual: unknown;

  constructor(actual: unknown, message: string) {
    super(message);
    this.name = 'AssertionError';
    this.actual = actual;
  }
}

export function assertTruthy(actual: unknown): asserts actual {
  if (!actual) {
    throw new AssertionError(actual, `Expected truthy`);
  }
}

export function assertSame<T>(actual: T, expected: T): void {
  if (actual !== expected) {
    throw new AssertionError(actual, `Expected same, got ${actual} !== ${expected}`);
  }
}

export function assertNotSame<T>(actual: T, expected: T): void {
  if (actual === expected) {
    throw new AssertionError(actual, `Expected not same, got ${actual} === ${expected}`);
  }
}

export function assertOkResult<TOk, TError extends ErrorType>(
  actual: Result<unknown, ErrorType>
): actual is OkResult<TOk, TError> {
  if (actual.isError()) {
    throw new AssertionError(actual, `Expected ok, got error ${actual.error}: ${actual.message}`);
  }
  return true;
}

export function assertErrorResult(
  actual: Result<unknown, ErrorType>,
  expectedErrorType: ErrorType,
  expectedMessage: string
): void {
  if (!actual.isError()) {
    throw new AssertionError(actual, `Expected error, but was ok`);
  }
  const expectedString = `${expectedErrorType}: ${expectedMessage}`;
  const actualString = `${actual.error}: ${actual.message}`;
  assertSame(actualString, expectedString);
}

export function assertResultValue<TOk, TError extends ErrorType>(
  result: Result<TOk, TError>,
  expectedValue: TOk
): void {
  if (assertOkResult(result)) {
    if (!isFieldValueEqual(result.value, expectedValue)) {
      throw new AssertionError(result.value, `Expected result values to equal`);
    }
  }
}
