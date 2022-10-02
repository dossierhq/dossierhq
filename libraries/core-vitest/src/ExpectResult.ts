import type { ErrorType, OkResult, Result } from '@jonasb/datadata-core';
import { expect } from 'vitest';

export function expectOkResult<TOk, TError extends ErrorType>(
  actual: Result<unknown, ErrorType>
): actual is OkResult<TOk, TError> {
  if (actual.isError()) {
    throw new Error(`Expected ok, got error ${actual.error}: ${actual.message}`);
  }
  return true;
}

export function expectErrorResult(
  actual: Result<unknown, ErrorType>,
  expectedErrorType: ErrorType,
  expectedMessage: string
): void {
  if (!actual.isError()) {
    throw new Error(`Expected error, but was ok`);
  }
  const expectedString = `${expectedErrorType}: ${expectedMessage}`;
  const actualString = `${actual.error}: ${actual.message}`;
  if (actualString !== expectedString) {
    throw new Error(`Expected (${expectedString}), got ${actualString}`);
  }
}

export function expectResultValue<TOk, TError extends ErrorType>(
  result: Result<TOk, TError>,
  expectedValue: TOk
): void {
  if (expectOkResult(result)) {
    const actualCopy = deepCopyForIsEqual(result.value);
    const expectedCopy = deepCopyForIsEqual(expectedValue);
    expect(actualCopy).toEqual<TOk>(expectedCopy);
  }
}

//TODO remove when no longer using Temporal?
function deepCopyForIsEqual<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'object') {
    const copy = { ...obj };
    for (const [key, value] of Object.entries(obj)) {
      copy[key as keyof T] = deepCopyForIsEqual(value);
    }
    return copy;
  }
  return obj;
}
