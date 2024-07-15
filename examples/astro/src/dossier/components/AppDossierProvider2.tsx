import {
  convertJsonDossierClientResult,
  createBaseDossierClient,
  createConsoleLogger,
  encodeObjectToURLSearchParams,
  type ClientContext,
  type DossierClient,
  type DossierClientMiddleware,
  type DossierClientOperation,
  type ErrorType,
  type Result,
} from '@dossierhq/core';
import { DossierProvider, useCachingDossierMiddleware } from '@dossierhq/react-components2';
import { useMemo } from 'react';
import { fetchJsonResult } from '../utils/fetchJsonResult';

type BackendContext = ClientContext;

const logger = createConsoleLogger(console);

export function AppDossierProvider2({ children }: { children: React.ReactNode }) {
  const cachingMiddleware = useCachingDossierMiddleware();

  const args = useMemo(
    () => ({
      client: createBackendDossierClient(cachingMiddleware),
    }),
    [cachingMiddleware],
  );

  return (
    <DossierProvider client={args.client} logger={logger}>
      {children}
    </DossierProvider>
  );
}

function createBackendDossierClient(
  cachingMiddleware: DossierClientMiddleware<BackendContext>,
): DossierClient {
  const context: BackendContext = { logger };
  return createBaseDossierClient({
    context,
    pipeline: [cachingMiddleware, terminatingAdminMiddleware],
  });
}

async function terminatingAdminMiddleware(
  context: BackendContext,
  operation: DossierClientOperation,
): Promise<void> {
  let result: Result<unknown, ErrorType>;
  if (operation.modifies) {
    result = await fetchJsonResult(context, operationToUrl(operation.name), {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(operation.args),
    });
  } else {
    result = await fetchJsonResult(context, operationToUrl(operation.name, operation.args));
  }
  operation.resolve(convertJsonDossierClientResult(operation.name, result));
}

function operationToUrl(operationName: string, args?: unknown) {
  return `/api/dossier-admin/${operationName}?${encodeObjectToURLSearchParams(
    { args },
    { keepEmptyObjects: true },
  )}`;
}
