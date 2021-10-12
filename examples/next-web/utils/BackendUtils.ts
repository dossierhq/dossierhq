import type {
  AdminClientJsonOperation,
  AdminClientOperationName,
  ErrorType,
  PromiseResult,
  PublishedClientJsonOperation,
  PublishedClientOperationName,
} from '@jonasb/datadata-core';
import { buildUrlWithUrlQuery, notOk, ok, stringifyUrlQueryParams } from '@jonasb/datadata-core';

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

export const urls = {
  admin: (operationName: AdminClientOperationName, operation?: AdminClientJsonOperation): string =>
    buildUrlWithUrlQuery(
      `${baseUrl}/admin/${operationName}`,
      stringifyUrlQueryParams({ operation }, { keepEmptyObjects: true })
    ),
  published: (
    operationName: PublishedClientOperationName,
    operation?: PublishedClientJsonOperation
  ): string =>
    buildUrlWithUrlQuery(
      `${baseUrl}/admin/${operationName}`,
      stringifyUrlQueryParams({ operation }, { keepEmptyObjects: true })
    ),
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
