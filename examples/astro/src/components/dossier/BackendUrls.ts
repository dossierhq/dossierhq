import type {
  AdminClientJsonOperationArgs,
  AdminClientOperationName,
  PublishedClientJsonOperationArgs,
  PublishedClientOperationName,
} from '@dossierhq/core';
import { encodeObjectToURLSearchParams } from '@dossierhq/core';

const baseUrl = '/api';

export const BackendUrls = {
  admin: (
    operationName: (typeof AdminClientOperationName)[keyof typeof AdminClientOperationName],
    args?: AdminClientJsonOperationArgs,
  ): string =>
    `${baseUrl}/dossier-admin/${operationName}?${encodeObjectToURLSearchParams(
      { args },
      { keepEmptyObjects: true },
    )}`,
  published: (
    operationName: (typeof PublishedClientOperationName)[keyof typeof PublishedClientOperationName],
    args?: PublishedClientJsonOperationArgs,
  ): string =>
    `${baseUrl}/dossier-published/${operationName}?${encodeObjectToURLSearchParams(
      { args },
      { keepEmptyObjects: true },
    )}`,
};
