import { Temporal } from '@js-temporal/polyfill';
import type { ErrorType, Logger, OkResult, Result } from '.';

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

function deepCopyForIsEqual<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (obj instanceof Temporal.Instant) {
    // Since the epoch isn't stored as a property for Instant (but a slot), jest isn't able to compare them.
    // Replace with string representation
    return obj.toString() as unknown as T;
  }
  if (typeof obj === 'object') {
    const copy = { ...obj };
    for (const [key, value] of Object.entries(obj)) {
      copy[key as keyof T] = deepCopyForIsEqual(value);
    }
    return copy;
  }
  return obj;
}

export function createMockLogger(): {
  error: jest.MockedFunction<Logger['error']>;
  warn: jest.MockedFunction<Logger['warn']>;
  info: jest.MockedFunction<Logger['info']>;
  debug: jest.MockedFunction<Logger['debug']>;
} {
  return {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  };
}
