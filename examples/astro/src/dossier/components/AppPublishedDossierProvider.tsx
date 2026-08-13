import {
  convertJsonPublishedDossierClientResult,
  createBasePublishedDossierClient,
  createConsoleLogger,
  encodeObjectToURLSearchParams,
  type ClientContext,
  type PublishedDossierClient,
  type PublishedDossierClientOperation,
} from '@dossierhq/core';
import { PublishedDossierProvider } from '@dossierhq/react-components2';
import { useMemo } from 'react';
import { fetchJsonResult } from '../utils/fetchJsonResult.js';

type BackendContext = ClientContext;

const logger = createConsoleLogger(console);

export function AppPublishedDossierProvider({ children }: { children: React.ReactNode }) {
  const args = useMemo(
    () => ({
      publishedClient: createBackendPublishedClient(),
    }),
    [],
  );

  return (
    <PublishedDossierProvider publishedClient={args.publishedClient} logger={logger}>
      {children}
    </PublishedDossierProvider>
  );
}

function createBackendPublishedClient(): PublishedDossierClient {
  const context: BackendContext = { logger };
  return createBasePublishedDossierClient({ context, pipeline: [terminatingPublishedMiddleware] });
}

async function terminatingPublishedMiddleware(
  context: BackendContext,
  operation: PublishedDossierClientOperation,
): Promise<void> {
  const result = await fetchJsonResult(context, operationToUrl(operation.name, operation.args));
  operation.resolve(convertJsonPublishedDossierClientResult(operation.name, result));
}

function operationToUrl(operationName: string, args: unknown): RequestInfo {
  return `/api/dossier-published/${operationName}?${encodeObjectToURLSearchParams(
    { args },
    { keepEmptyObjects: true },
  )}`;
}
