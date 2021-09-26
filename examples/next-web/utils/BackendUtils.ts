import type {
  AdminClientJsonOperation,
  AdminClientOperationName,
  ErrorType,
  PromiseResult,
} from '@jonasb/datadata-core';
import { notOk, ok } from '@jonasb/datadata-core';
import { encodeQuery } from './QueryUtils';

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

export const urls = {
  admin: (operationName: AdminClientOperationName, operation?: AdminClientJsonOperation): string =>
    `${baseUrl}/admin/${operationName}${operation ? `?${encodeQuery({ operation })}` : ''}`,
};

export async function fetchJsonResult<TOk>(
  input: RequestInfo,
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
    return notOk.GenericUnexpectedException(error);
  }
}
