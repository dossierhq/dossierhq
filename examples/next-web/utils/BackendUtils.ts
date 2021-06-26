import type { AdminQuery, Paging, PromiseResult } from '@datadata/core';
import { createErrorResult, ErrorType, notOk, ok } from '@datadata/core';
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
  archiveEntity: (id: string): string => `${baseUrl}/archive-entity/${id}`,
  unarchiveEntity: (id: string): string => `${baseUrl}/unarchive-entity/${id}`,
  createEntity: `${baseUrl}/entities`,
  getEntity: (id: string, version?: number | null): string =>
    `${baseUrl}/entities/${id}${version ? `?version=${version}` : ''}`,
  publishEntities: `${baseUrl}/publish-entities`,
  unpublishEntities: `${baseUrl}/unpublish-entities`,
  getEntityHistory: (id: string): string => `${baseUrl}/entity-history/${id}`,
  getPublishingHistory: (id: string): string => `${baseUrl}/publishing-history/${id}`,
  searchEntities: (query?: AdminQuery, paging?: Paging): string =>
    `${baseUrl}/search-entities?${encodeQuery({ query, paging })}`,
};

export async function fetchJson<T>(
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

// TODO move to core
const statusErrorMapping = new Map<number, ErrorType>();
statusErrorMapping.set(400, ErrorType.BadRequest);
statusErrorMapping.set(409, ErrorType.Conflict);
statusErrorMapping.set(401, ErrorType.NotAuthenticated);
statusErrorMapping.set(404, ErrorType.NotFound);

export async function fetchJsonResult<TOk, TError extends ErrorType | ErrorType.Generic>(
  expectedErrors: TError[],
  input: RequestInfo,
  init?: RequestInit
): PromiseResult<TOk, TError | ErrorType.Generic> {
  try {
    const response = await fetch(input, init);
    if (!response.ok) {
      const responseText = await response.text();
      const errorType = statusErrorMapping.get(response.status);
      if (!errorType) {
        return notOk.Generic(`${response.status} ${responseText}`);
      }
      const responseJson = JSON.parse(responseText);
      const { message } = responseJson;
      if (!expectedErrors.includes(errorType as TError)) {
        return notOk.Generic(`Unexpected error type: ${errorType}: ${message}`);
      }
      return createErrorResult(errorType as TError, message);
    }
    const json: TOk = await response.json();
    return ok(json);
  } catch (error) {
    return notOk.Generic(`Unexpected ${error.name}: ${error.message}`);
  }
}
