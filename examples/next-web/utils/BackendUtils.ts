import type { AdminQuery, Paging, PromiseResult } from '@datadata/core';
import { ErrorType, ok } from '@datadata/core';
import { encodeQuery } from './QueryUtils';

export enum OperationStatus {
  None,
  InProgress,
  Finished,
  Failed,
}

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

export const urls = {
  schema: `${baseUrl}/schema`,
  createEntity: `${baseUrl}/entities`,
  getEntity: (id: string, options: { version?: number | null }): string =>
    `${baseUrl}/entities/${id}?${encodeQuery({ options })}`,
  searchEntities: (query?: AdminQuery, paging?: Paging): string =>
    `${baseUrl}/search-entities?${encodeQuery({ query, paging })}`,
};

export async function fetchJsonAsync<T>(
  input: RequestInfo,
  init?: RequestInit,
  setOperationStatus?: (status: OperationStatus) => void
): Promise<T> {
  try {
    if (setOperationStatus) {
      setOperationStatus(OperationStatus.InProgress);
    }
    const response = await fetch(input, init);
    if (!response.ok) {
      const responseText = await response.text();
      throw Error(`Failed request (${response.status}), ${responseText}`);
    }
    const json = await response.json();
    if (setOperationStatus) {
      setOperationStatus(OperationStatus.Finished);
    }
    return json;
  } catch (error) {
    if (setOperationStatus) {
      setOperationStatus(OperationStatus.Failed);
    }
    throw error;
  }
}

const statusErrorMapping = new Map<number, ErrorType>();
statusErrorMapping.set(400, ErrorType.BadRequest);
statusErrorMapping.set(409, ErrorType.Conflict);
statusErrorMapping.set(401, ErrorType.NotAuthenticated);
statusErrorMapping.set(404, ErrorType.NotFound);

export async function fetchJsonResult<TOk, TError extends ErrorType>(
  expectedErrors: [TError],
  input: RequestInfo,
  init?: RequestInit
): PromiseResult<TOk, TError> {
  const response = await fetch(input, init);
  if (!response.ok) {
    const responseText = await response.text();
    const errorType = statusErrorMapping.get(response.status);
    if (!errorType || expectedErrors.indexOf(errorType as TError) < 0) {
      throw new Error(`${response.status} ${responseText}`);
    }
  }
  const json: TOk = await response.json();
  return ok(json);
}
