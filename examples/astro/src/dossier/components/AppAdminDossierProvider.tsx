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
import {
  DossierProvider,
  useCachingDossierMiddleware,
  type DossierContextAdapter,
  type FieldEditorProps,
  type RichTextComponentEditorProps,
} from '@dossierhq/react-components';
import { useMemo } from 'react';
import { fetchJsonResult } from '../utils/fetchJsonResult.ts';

type BackendContext = ClientContext;

const logger = createConsoleLogger(console);

class AdminContextAdapter implements DossierContextAdapter {
  renderFieldEditor(_props: FieldEditorProps): JSX.Element | null {
    return null;
  }

  renderRichTextComponentEditor(_props: RichTextComponentEditorProps): JSX.Element | null {
    return null;
  }
}

export function AppAdminDossierProvider({ children }: { children: React.ReactNode }) {
  const cachingMiddleware = useCachingDossierMiddleware();

  const args = useMemo(
    () => ({
      client: createBackendDossierClient(cachingMiddleware),
      adapter: new AdminContextAdapter(),
    }),
    [cachingMiddleware],
  );

  const { client } = args;
  if (!client) {
    return null;
  }
  return (
    <DossierProvider {...args} client={client}>
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
