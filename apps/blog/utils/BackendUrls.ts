import type {
  DossierClientJsonOperationArgs,
  DossierClientOperationName,
  PublishedDossierClientJsonOperationArgs,
  PublishedDossierClientOperationName,
} from '@dossierhq/core';
import { encodeObjectToURLSearchParams } from '@dossierhq/core';

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

export const BackendUrls = {
  admin: (
    operationName: keyof typeof DossierClientOperationName,
    args?: DossierClientJsonOperationArgs,
  ): string =>
    `${baseUrl}/admin/${operationName}?${encodeObjectToURLSearchParams(
      { args },
      { keepEmptyObjects: true },
    )}`,
  published: (
    operationName: keyof typeof PublishedDossierClientOperationName,
    args: PublishedDossierClientJsonOperationArgs,
  ): string =>
    `${baseUrl}/published/${operationName}?${encodeObjectToURLSearchParams(
      { args },
      { keepEmptyObjects: true },
    )}`,
};
