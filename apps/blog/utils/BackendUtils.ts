import type { ErrorType, Logger, PromiseResult } from '@jonasb/datadata-core';
import { notOk, ok } from '@jonasb/datadata-core';

export async function fetchJsonResult<TOk>(
  context: { logger: Logger },
  input: string, // TODO bun-types requires string, should be RequestInfo
  init?: RequestInit
): PromiseResult<TOk, ErrorType> {
  try {
    const response = await fetch(input, init);
    if (!response.ok) {
      let errorText = await response.text();
      try {
        const errorTextJson = JSON.parse(errorText);
        if (typeof errorTextJson?.message === 'string') {
          errorText = errorTextJson.message;
        }
      } catch {
        //ignore
      }
      return notOk.fromHttpStatus(response.status, errorText);
    }
    const json: TOk = await response.json();
    return ok(json);
  } catch (error) {
    return notOk.GenericUnexpectedException(context, error);
  }
}
