import type {
  AdminClient,
  AdminClientMiddleware,
  AdminClientOperation,
  ClientContext,
  ErrorType,
  Result,
} from '@dossierhq/core';
import {
  convertJsonAdminClientResult,
  createBaseAdminClient,
  createConsoleLogger,
} from '@dossierhq/core';
import type {
  AdminDossierContextAdapter,
  FieldEditorProps,
  RichTextValueItemEditorProps,
} from '@dossierhq/react-components';
import { AdminDossierProvider, useCachingAdminMiddleware } from '@dossierhq/react-components';
import { useMemo } from 'react';
import { DISPLAY_AUTH_KEYS } from '../config/AuthKeyConfig';
import { BackendUrls } from '../utils/BackendUrls';
import { fetchJsonResult } from '../utils/BackendUtils';

type BackendContext = ClientContext;

const logger = createConsoleLogger(console);

class AdminContextAdapter implements AdminDossierContextAdapter {
  renderAdminFieldEditor(_props: FieldEditorProps): JSX.Element | null {
    return null;
  }

  renderAdminRichTextComponentEditor(_props: RichTextValueItemEditorProps): JSX.Element | null {
    return null;
  }
}

export function AppAdminDossierProvider({ children }: { children: React.ReactNode }) {
  const cachingMiddleware = useCachingAdminMiddleware();

  const args = useMemo(
    () => ({
      adminClient: createBackendAdminClient(cachingMiddleware),
      adapter: new AdminContextAdapter(),
      authKeys: DISPLAY_AUTH_KEYS,
    }),
    [cachingMiddleware],
  );

  const { adminClient } = args;
  if (!adminClient) {
    return null;
  }
  return (
    <AdminDossierProvider {...args} adminClient={adminClient}>
      {children}
    </AdminDossierProvider>
  );
}

function createBackendAdminClient(
  cachingMiddleware: AdminClientMiddleware<BackendContext>,
): AdminClient {
  const context: BackendContext = { logger };
  return createBaseAdminClient({
    context,
    pipeline: [cachingMiddleware, terminatingAdminMiddleware],
  });
}

async function terminatingAdminMiddleware(
  context: BackendContext,
  operation: AdminClientOperation,
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
  operation.resolve(convertJsonAdminClientResult(operation.name, result));
}
