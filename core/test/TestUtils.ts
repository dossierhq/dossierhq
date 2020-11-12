import type { ErrorType, Result } from '../src';

export function expectErrorResult(
  actual: Result<unknown, ErrorType>,
  expectedErrorType: ErrorType,
  expectedMessage: string
): void {
  expect(actual.isError()).toBeTruthy();
  if (actual.isError()) {
    expect(actual.error).toEqual(expectedErrorType);
    expect(actual.message).toEqual(expectedMessage);
  }
}
