import type {
  AdminClientJsonOperationArgs,
  AdminClientOperationName,
  PublishedClientJsonOperationArgs,
  PublishedClientOperationName,
} from '@dossierhq/core';
import { encodeObjectToURLSearchParams } from '@dossierhq/core';

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

export const BackendUrls = {
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
