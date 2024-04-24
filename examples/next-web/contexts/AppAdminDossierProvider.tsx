import type {
  DossierClient,
  DossierClientMiddleware,
  DossierClientOperation,
  ClientContext,
  ErrorType,
  Result,
} from '@dossierhq/core';
import {
  convertJsonDossierClientResult,
  createBaseDossierClient,
  createConsoleLogger,
} from '@dossierhq/core';
import type {
  AdminDossierContextAdapter,
  FieldEditorProps,
  RichTextComponentEditorProps,
} from '@dossierhq/react-components';
import { AdminDossierProvider, useCachingAdminMiddleware } from '@dossierhq/react-components';
import { useMemo } from 'react';
import { BackendUrls } from '../utils/BackendUrls';
import { fetchJsonResult } from '../utils/BackendUtils';

type BackendContext = ClientContext;

const logger = createConsoleLogger(console);

class AdminContextAdapter implements AdminDossierContextAdapter {
  renderAdminFieldEditor(_props: FieldEditorProps): JSX.Element | null {
    return null;
  }

  renderAdminRichTextComponentEditor(_props: RichTextComponentEditorProps): JSX.Element | null {
    return null;
  }
}

export function AppAdminDossierProvider({ children }: { children: React.ReactNode }) {
  const cachingMiddleware = useCachingAdminMiddleware();

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
    <AdminDossierProvider {...args} client={client}>
      {children}
    </AdminDossierProvider>
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
    result = await fetchJsonResult(context, BackendUrls.admin(operation.name), {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(operation.args),
    });
  } else {
    result = await fetchJsonResult(context, BackendUrls.admin(operation.name, operation.args));
  }
  operation.resolve(convertJsonDossierClientResult(operation.name, result));
}
