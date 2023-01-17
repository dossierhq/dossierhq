import type {
  AdminDossierContextAdapter,
  DisplayAuthKey,
  FieldDisplayProps,
  FieldEditorProps,
  PublishedDossierContextAdapter,
  RichTextValueItemDisplayProps,
  RichTextValueItemEditorProps,
} from '@dossierhq/react-components';
import {
  AdminDossierProvider,
  PublishedDossierProvider,
  useCachingAdminMiddleware,
} from '@dossierhq/react-components';
import type {
  AdminClient,
  AdminClientMiddleware,
  AdminClientOperation,
  ClientContext,
  ErrorType,
  Logger,
  PublishedClient,
  PublishedClientOperation,
  Result,
} from '@dossierhq/core';
import {
  convertJsonAdminClientResult,
  convertJsonPublishedClientResult,
  createBaseAdminClient,
  createBasePublishedClient,
} from '@dossierhq/core';
import { useMemo } from 'react';
import { fetchJsonResult, urls } from '../utils/BackendUtils';

const DISPLAY_AUTH_KEYS: DisplayAuthKey[] = [
  { authKey: 'none', displayName: 'None' },
  { authKey: 'subject', displayName: 'User private' },
];
const AUTH_KEYS_HEADER = {
  'Dossier-Default-Auth-Keys': DISPLAY_AUTH_KEYS.map((it) => it.authKey).join(', '),
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

export class AdminContextAdapter implements AdminDossierContextAdapter {
  renderAdminFieldEditor(_props: FieldEditorProps): JSX.Element | null {
    return null;
  }
  renderAdminRichTextValueItemEditor(_props: RichTextValueItemEditorProps): JSX.Element | null {
    return null;
  }
}

export class PublishedContextAdapter implements PublishedDossierContextAdapter {
  renderPublishedFieldDisplay(_props: FieldDisplayProps): JSX.Element | null {
    return null;
  }
  renderPublishedRichTextValueItemDisplay(
    _props: RichTextValueItemDisplayProps
  ): JSX.Element | null {
    return null;
  }
}

export function DossierSharedProvider({ children }: { children: React.ReactNode }) {
  const cachingMiddleware = useCachingAdminMiddleware();

  const args = useMemo(
    () => ({
      adminClient: createBackendAdminClient(cachingMiddleware),
      adapter: new AdminContextAdapter(),
      authKeys: DISPLAY_AUTH_KEYS,
    }),
    [cachingMiddleware]
  );
  return <AdminDossierProvider {...args}>{children}</AdminDossierProvider>;
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
  return <PublishedDossierProvider {...args}>{children}</PublishedDossierProvider>;
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
      headers: AUTH_KEYS_HEADER,
    });
  }
  operation.resolve(convertJsonAdminClientResult(operation.name, result));
}

async function terminatingPublishedMiddleware(
  context: BackendContext,
  operation: PublishedClientOperation
): Promise<void> {
  const result = await fetchJsonResult(context, urls.published(operation.name, operation.args), {
    method: 'GET',
    headers: AUTH_KEYS_HEADER,
  });

  operation.resolve(convertJsonPublishedClientResult(operation.name, result));
}
