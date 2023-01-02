import type {
  AdminClientJsonOperationArgs,
  AdminClientOperationName,
  PublishedClientJsonOperationArgs,
  PublishedClientOperationName,
} from '@jonasb/datadata-core';
import { encodeObjectToURLSearchParams } from '@jonasb/datadata-core';

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

export const BackendUrls = {
  admin: (
    operationName: keyof typeof AdminClientOperationName,
    args?: AdminClientJsonOperationArgs
  ): string =>
    `${baseUrl}/admin/${operationName}?${encodeObjectToURLSearchParams(
      { args },
      { keepEmptyObjects: true }
    )}`,
  published: (
    operationName: keyof typeof PublishedClientOperationName,
    args: PublishedClientJsonOperationArgs
  ): string =>
    `${baseUrl}/published/${operationName}?${encodeObjectToURLSearchParams(
      { args },
      { keepEmptyObjects: true }
    )}`,
};
