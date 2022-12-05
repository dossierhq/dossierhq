import type {
  FieldDisplayProps,
  PublishedDataDataContextAdapter,
  RichTextValueItemDisplayProps,
} from '@jonasb/datadata-admin-react-components';
import { PublishedDataDataProvider } from '@jonasb/datadata-admin-react-components';
import type {
  ClientContext,
  ErrorType,
  PublishedClient,
  PublishedClientOperation,
  Result,
} from '@jonasb/datadata-core';
import {
  convertJsonPublishedClientResult,
  convertPublishedClientOperationToJson,
  createBasePublishedClient,
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

class PublishedContextAdapter implements PublishedDataDataContextAdapter {
  renderPublishedFieldDisplay(_props: FieldDisplayProps): JSX.Element | null {
    return null;
  }
  renderPublishedRichTextValueItemDisplay(
    _props: RichTextValueItemDisplayProps
  ): JSX.Element | null {
    return null;
  }
}

export function AppPublishedDataDataProvider({ children }: { children: React.ReactNode }) {
  const inBrowserValue = useContext(InBrowserServerContext);

  const args = useMemo(
    () => ({
      publishedClient: inBrowserValue
        ? createInBrowserPublishedClient(inBrowserValue.server)
        : createBackendPublishedClient(),
      adapter: new PublishedContextAdapter(),
      authKeys: DISPLAY_AUTH_KEYS,
    }),
    [inBrowserValue]
  );

  const { publishedClient } = args;
  if (!publishedClient) {
    return;
  }
  return (
    <PublishedDataDataProvider {...args} publishedClient={publishedClient}>
      {children}
    </PublishedDataDataProvider>
  );
}

function createInBrowserPublishedClient(server: Server | null): PublishedClient | null {
  if (!server) return null;
  const sessionResult = server.createSession(SYSTEM_USERS.editor);
  return server.createPublishedClient(() => sessionResult);
}

function createBackendPublishedClient(): PublishedClient {
  const context: BackendContext = { logger };
  return createBasePublishedClient({ context, pipeline: [terminatingPublishedMiddleware] });
}

async function terminatingPublishedMiddleware(
  context: BackendContext,
  operation: PublishedClientOperation
): Promise<void> {
  const jsonOperation = convertPublishedClientOperationToJson(operation);

  let result: Result<unknown, ErrorType>;
  if (operation.modifies) {
    result = await fetchJsonResult(context, BackendUrls.published(operation.name), {
      method: 'PUT',
      headers: { ...AUTH_KEYS_HEADER, 'content-type': 'application/json' },
      body: JSON.stringify(jsonOperation),
    });
  } else {
    result = await fetchJsonResult(context, BackendUrls.published(operation.name, jsonOperation), {
      method: 'GET',
      headers: { ...AUTH_KEYS_HEADER, 'content-type': 'application/json' },
    });
  }
  operation.resolve(convertJsonPublishedClientResult(operation.name, result));
}
