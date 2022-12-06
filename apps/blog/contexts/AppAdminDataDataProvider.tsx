import type {
  AdminDataDataContextAdapter,
  FieldEditorProps,
  RichTextValueItemEditorProps,
  SwrConfigRef,
} from '@jonasb/datadata-admin-react-components';
import {
  AdminDataDataProvider,
  createCachingAdminMiddleware,
} from '@jonasb/datadata-admin-react-components';
import type {
  AdminClient,
  AdminClientOperation,
  ClientContext,
  ErrorType,
  Result,
} from '@jonasb/datadata-core';
import {
  convertAdminClientOperationToJson,
  convertJsonAdminClientResult,
  createBaseAdminClient,
  createConsoleLogger,
} from '@jonasb/datadata-core';
import type { Server } from '@jonasb/datadata-server';
import { useContext, useMemo, useRef } from 'react';
import { useSWRConfig } from 'swr';
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
  const { cache, mutate } = useSWRConfig();
  const swrConfigRef = useRef({ cache, mutate });
  swrConfigRef.current = { cache, mutate };
  const inBrowserValue = useContext(InBrowserServerContext);

  const args = useMemo(
    () => ({
      adminClient: inBrowserValue
        ? createInBrowserAdminClient(inBrowserValue.server, swrConfigRef)
        : createBackendAdminClient(swrConfigRef),
      adapter: new AdminContextAdapter(),
      authKeys: DISPLAY_AUTH_KEYS,
    }),
    [inBrowserValue]
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

function createInBrowserAdminClient(server: Server | null, swrConfigRef: SwrConfigRef) {
  if (!server) return null;

  const sessionResult = server.createSession(SYSTEM_USERS.editor);
  return server.createAdminClient(
    () => sessionResult,
    [createCachingAdminMiddleware(swrConfigRef)]
  );
}

function createBackendAdminClient(swrConfigRef: SwrConfigRef): AdminClient {
  const context: BackendContext = { logger };
  return createBaseAdminClient({
    context,
    pipeline: [createCachingAdminMiddleware(swrConfigRef), terminatingAdminMiddleware],
  });
}

async function terminatingAdminMiddleware(
  context: BackendContext,
  operation: AdminClientOperation
): Promise<void> {
  const jsonOperation = convertAdminClientOperationToJson(operation);

  let result: Result<unknown, ErrorType>;
  if (operation.modifies) {
    result = await fetchJsonResult(context, BackendUrls.admin(operation.name), {
      method: 'PUT',
      headers: { ...AUTH_KEYS_HEADER, 'content-type': 'application/json' },
      body: JSON.stringify(jsonOperation),
    });
  } else {
    result = await fetchJsonResult(context, BackendUrls.admin(operation.name, jsonOperation), {
      method: 'GET',
      headers: { ...AUTH_KEYS_HEADER, 'content-type': 'application/json' },
    });
  }
  operation.resolve(convertJsonAdminClientResult(operation.name, result));
}
