import type { ErrorType, OkResult, Result } from '.';

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
