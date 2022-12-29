import type {
  AdminDataDataContextAdapter,
  FieldEditorProps,
  RichTextValueItemEditorProps,
} from '@jonasb/datadata-admin-react-components';
import {
  AdminDataDataProvider,
  useCachingAdminMiddleware,
} from '@jonasb/datadata-admin-react-components';
import type {
  AdminClient,
  AdminClientMiddleware,
  AdminClientOperation,
  ClientContext,
  ErrorType,
  Result,
} from '@jonasb/datadata-core';
import {
  convertJsonAdminClientResult,
  createBaseAdminClient,
  createConsoleLogger,
} from '@jonasb/datadata-core';
import type { Server } from '@jonasb/datadata-server';
import { useContext, useMemo } from 'react';
import { AUTH_KEYS_HEADER, DISPLAY_AUTH_KEYS } from '../config/AuthKeyConfig';
import { SYSTEM_USERS } from '../config/SystemUsers';
import { BackendUrls } from '../utils/BackendUrls';
import { fetchJsonResult } from '../utils/BackendUtils';
import { InBrowserServerContext } from './InBrowserServerContext';

type BackendContext = ClientContext;

const logger = createConsoleLogger(console);

class AdminContextAdapter implements AdminDataDataContextAdapter {
  renderAdminFieldEditor(_props: FieldEditorProps): JSX.Element | null {
    return null;
  }
  renderAdminRichTextValueItemEditor(_props: RichTextValueItemEditorProps): JSX.Element | null {
    return null;
  }
}

export function AppAdminDataDataProvider({ children }: { children: React.ReactNode }) {
  const inBrowserValue = useContext(InBrowserServerContext);
  const cachingMiddleware = useCachingAdminMiddleware();

  const args = useMemo(
    () => ({
      adminClient: inBrowserValue
        ? createInBrowserAdminClient(inBrowserValue.server, cachingMiddleware)
        : createBackendAdminClient(cachingMiddleware),
      adapter: new AdminContextAdapter(),
      authKeys: DISPLAY_AUTH_KEYS,
    }),
    [inBrowserValue, cachingMiddleware]
  );

  const { adminClient } = args;
  if (!adminClient) {
    return null;
  }
  return (
    <AdminDataDataProvider {...args} adminClient={adminClient}>
      {children}
    </AdminDataDataProvider>
  );
}

function createInBrowserAdminClient(
  server: Server | null,
  cachingMiddleware: AdminClientMiddleware<BackendContext>
) {
  if (!server) return null;

  const sessionResult = server.createSession(SYSTEM_USERS.editor);
  return server.createAdminClient(() => sessionResult, [cachingMiddleware]);
}

function createBackendAdminClient(
  cachingMiddleware: AdminClientMiddleware<BackendContext>
): AdminClient {
  const context: BackendContext = { logger };
  return createBaseAdminClient({
    context,
    pipeline: [cachingMiddleware, terminatingAdminMiddleware],
  });
}

async function terminatingAdminMiddleware(
  context: BackendContext,
  operation: AdminClientOperation
): Promise<void> {
  let result: Result<unknown, ErrorType>;
  if (operation.modifies) {
    result = await fetchJsonResult(context, BackendUrls.admin(operation.name), {
      method: 'PUT',
      headers: { ...AUTH_KEYS_HEADER, 'content-type': 'application/json' },
      body: JSON.stringify(operation.args),
    });
  } else {
    result = await fetchJsonResult(context, BackendUrls.admin(operation.name, operation.args), {
      method: 'GET',
      headers: AUTH_KEYS_HEADER,
    });
  }
  operation.resolve(convertJsonAdminClientResult(operation.name, result));
}
