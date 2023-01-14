import type {
  AdminClientJsonOperationArgs,
  AdminClientOperationName,
  ErrorType,
  Logger,
  PromiseResult,
  PublishedClientJsonOperationArgs,
  PublishedClientOperationName,
} from '@jonasb/datadata-core';
import { encodeObjectToURLSearchParams, notOk, ok } from '@jonasb/datadata-core';

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

export const urls = {
  admin: (
    operationName: (typeof AdminClientOperationName)[keyof typeof AdminClientOperationName],
    args?: AdminClientJsonOperationArgs
  ): string =>
    `${baseUrl}/admin/${operationName}?${encodeObjectToURLSearchParams(
      { args },
      { keepEmptyObjects: true }
    )}`,
  published: (
    operationName: (typeof PublishedClientOperationName)[keyof typeof PublishedClientOperationName],
    args?: PublishedClientJsonOperationArgs
  ): string =>
    `${baseUrl}/published/${operationName}?${encodeObjectToURLSearchParams(
      { args },
      { keepEmptyObjects: true }
    )}`,
};

export async function fetchJsonResult<TOk>(
  context: { logger: Logger },
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
    return notOk.GenericUnexpectedException(context, error);
  }
}
