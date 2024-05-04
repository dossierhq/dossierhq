import {
  encodeObjectToURLSearchParams,
  type DossierClientOperationName,
  type JsonDossierClientOperationArgs,
  type JsonPublishedDossierClientOperationArgs,
  type PublishedDossierClientOperationName,
} from '@dossierhq/core';

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

export const BackendUrls = {
  admin: (
    operationName: (typeof DossierClientOperationName)[keyof typeof DossierClientOperationName],
    args?: JsonDossierClientOperationArgs,
  ): string =>
    `${baseUrl}/admin/${operationName}?${encodeObjectToURLSearchParams(
      { args },
      { keepEmptyObjects: true },
    )}`,
  published: (
    operationName: (typeof PublishedDossierClientOperationName)[keyof typeof PublishedDossierClientOperationName],
    args?: JsonPublishedDossierClientOperationArgs,
  ): string =>
    `${baseUrl}/published/${operationName}?${encodeObjectToURLSearchParams(
      { args },
      { keepEmptyObjects: true },
    )}`,
};
