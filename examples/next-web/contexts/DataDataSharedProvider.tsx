import type {
  AdminDataDataContextAdapter,
  DisplayAuthKey,
  FieldDisplayProps,
  FieldEditorProps,
  PublishedDataDataContextAdapter,
  RichTextValueItemDisplayProps,
  RichTextValueItemEditorProps,
  SwrConfigRef,
} from '@jonasb/datadata-admin-react-components';
import {
  AdminDataDataProvider,
  createCachingAdminMiddleware,
  PublishedDataDataProvider,
} from '@jonasb/datadata-admin-react-components';
import type {
  AdminClient,
  AdminClientOperation,
  ClientContext,
  ErrorType,
  Logger,
  PublishedClient,
  PublishedClientOperation,
  Result,
} from '@jonasb/datadata-core';
import {
  convertJsonAdminClientResult,
  convertJsonPublishedClientResult,
  createBaseAdminClient,
  createBasePublishedClient,
} from '@jonasb/datadata-core';
import { useMemo, useRef } from 'react';
import { useSWRConfig } from 'swr';
import { fetchJsonResult, urls } from '../utils/BackendUtils';

const DISPLAY_AUTH_KEYS: DisplayAuthKey[] = [
  { authKey: 'none', displayName: 'None' },
  { authKey: 'subject', displayName: 'User private' },
];
const AUTH_KEYS_HEADER = {
  'DataData-Default-Auth-Keys': DISPLAY_AUTH_KEYS.map((it) => it.authKey).join(', '),
};

type BackendContext = ClientContext;

const logger: Logger = {
  error(message, ...args) {
    console.error(`error: ${message}`, ...args);
  },
  warn(message, ...args) {
    console.warn(`warn: ${message}`, ...args);
  },
  info(message, ...args) {
    console.info(`info: ${message}`, ...args);
  },
  debug(message, ...args) {
    console.debug(`debug: ${message}`, ...args);
  },
};

export class AdminContextAdapter implements AdminDataDataContextAdapter {
  renderAdminFieldEditor(_props: FieldEditorProps): JSX.Element | null {
    return null;
  }
  renderAdminRichTextValueItemEditor(_props: RichTextValueItemEditorProps): JSX.Element | null {
    return null;
  }
}

export class PublishedContextAdapter implements PublishedDataDataContextAdapter {
  renderPublishedFieldDisplay(_props: FieldDisplayProps): JSX.Element | null {
    return null;
  }
  renderPublishedRichTextValueItemDisplay(
    _props: RichTextValueItemDisplayProps
  ): JSX.Element | null {
    return null;
  }
}

export function DataDataSharedProvider({ children }: { children: React.ReactNode }) {
  const { cache, mutate } = useSWRConfig();
  const swrConfigRef = useRef({ cache, mutate });
  swrConfigRef.current = { cache, mutate };

  const args = useMemo(
    () => ({
      adminClient: createBackendAdminClient(swrConfigRef),
      adapter: new AdminContextAdapter(),
      authKeys: DISPLAY_AUTH_KEYS,
    }),
    []
  );
  return <AdminDataDataProvider {...args}>{children}</AdminDataDataProvider>;
}

export function PublishedDataDataSharedProvider({ children }: { children: React.ReactNode }) {
  const args = useMemo(
    () => ({
      publishedClient: createBackendPublishedClient(),
      adapter: new PublishedContextAdapter(),
      authKeys: DISPLAY_AUTH_KEYS,
    }),
    []
  );
  return <PublishedDataDataProvider {...args}>{children}</PublishedDataDataProvider>;
}

function createBackendAdminClient(swrConfigRef: SwrConfigRef): AdminClient {
  const context: BackendContext = { logger };
  return createBaseAdminClient({
    context,
    pipeline: [createCachingAdminMiddleware(swrConfigRef), terminatingAdminMiddleware],
  });
}

function createBackendPublishedClient(): PublishedClient {
  const context: BackendContext = { logger };
  return createBasePublishedClient({ context, pipeline: [terminatingPublishedMiddleware] });
}

async function terminatingAdminMiddleware(
  context: BackendContext,
  operation: AdminClientOperation
): Promise<void> {
  let result: Result<unknown, ErrorType>;
  if (operation.modifies) {
    result = await fetchJsonResult(context, urls.admin(operation.name), {
      method: 'PUT',
      headers: { ...AUTH_KEYS_HEADER, 'content-type': 'application/json' },
      body: JSON.stringify(operation.args),
    });
  } else {
    result = await fetchJsonResult(context, urls.admin(operation.name, operation.args), {
      method: 'GET',
      headers: { ...AUTH_KEYS_HEADER, 'content-type': 'application/json' },
    });
  }
  operation.resolve(convertJsonAdminClientResult(operation.name, result));
}

async function terminatingPublishedMiddleware(
  context: BackendContext,
  operation: PublishedClientOperation
): Promise<void> {
  let result: Result<unknown, ErrorType>;
  if (operation.modifies) {
    result = await fetchJsonResult(context, urls.published(operation.name), {
      method: 'PUT',
      headers: { ...AUTH_KEYS_HEADER, 'content-type': 'application/json' },
      body: JSON.stringify(operation.args),
    });
  } else {
    result = await fetchJsonResult(context, urls.published(operation.name, operation.args), {
      method: 'GET',
      headers: AUTH_KEYS_HEADER,
    });
  }
  operation.resolve(convertJsonPublishedClientResult(operation.name, result));
}
