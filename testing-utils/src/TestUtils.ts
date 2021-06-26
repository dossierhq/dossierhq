import type { ErrorType, Result } from '@datadata/core';
import { CoreTestUtils } from '@datadata/core';

const { expectOkResult } = CoreTestUtils;

export function expectResultValue<TOk, TError extends ErrorType>(
  result: Result<TOk, TError>,
  expectedValue: TOk
): void {
  if (expectOkResult(result)) {
    expect(result.value).toEqual<TOk>(expectedValue);
  }
}
