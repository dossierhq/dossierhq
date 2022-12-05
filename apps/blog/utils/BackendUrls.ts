import type {
  AdminClientJsonOperation,
  AdminClientOperationName,
  PublishedClientJsonOperation,
  PublishedClientOperationName,
} from '@jonasb/datadata-core';
import { buildUrlWithUrlQuery, stringifyUrlQueryParams } from '@jonasb/datadata-core';

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

export const BackendUrls = {
  admin: (
    operationName: keyof typeof AdminClientOperationName,
    operation?: AdminClientJsonOperation
  ): string =>
    buildUrlWithUrlQuery(
      `${baseUrl}/admin/${operationName}`,
      stringifyUrlQueryParams({ operation }, { keepEmptyObjects: true })
    ),
  published: (
    operationName: keyof typeof PublishedClientOperationName,
    operation?: PublishedClientJsonOperation
  ): string =>
    buildUrlWithUrlQuery(
      `${baseUrl}/published/${operationName}`,
      stringifyUrlQueryParams({ operation }, { keepEmptyObjects: true })
    ),
};
