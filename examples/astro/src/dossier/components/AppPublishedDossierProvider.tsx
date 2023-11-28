import {
  convertJsonPublishedClientResult,
  createBasePublishedClient,
  createConsoleLogger,
  encodeObjectToURLSearchParams,
  type ClientContext,
  type PublishedClient,
  type PublishedClientOperation,
} from '@dossierhq/core';
import {
  PublishedDossierProvider,
  type FieldDisplayProps,
  type PublishedDossierContextAdapter,
  type RichTextValueItemDisplayProps,
} from '@dossierhq/react-components';
import { useMemo } from 'react';
import { DISPLAY_AUTH_KEYS } from '../config/AuthKeyConfig.js';
import { fetchJsonResult } from '../utils/fetchJsonResult.js';

type BackendContext = ClientContext;

const logger = createConsoleLogger(console);

class PublishedContextAdapter implements PublishedDossierContextAdapter {
  renderPublishedFieldDisplay(_props: FieldDisplayProps): JSX.Element | null {
    return null;
  }

  renderPublishedRichTextComponentDisplay({
    value: _value,
  }: RichTextValueItemDisplayProps): JSX.Element | null {
    return null;
  }
}

export function AppPublishedDossierProvider({ children }: { children: React.ReactNode }) {
  const args = useMemo(
    () => ({
      publishedClient: createBackendPublishedClient(),
      adapter: new PublishedContextAdapter(),
      authKeys: DISPLAY_AUTH_KEYS,
    }),
    [],
  );

  const { publishedClient } = args;
  if (!publishedClient) {
    return null;
  }
  return (
    <PublishedDossierProvider {...args} publishedClient={publishedClient}>
      {children}
    </PublishedDossierProvider>
  );
}

function createBackendPublishedClient(): PublishedClient {
  const context: BackendContext = { logger };
  return createBasePublishedClient({ context, pipeline: [terminatingPublishedMiddleware] });
}

async function terminatingPublishedMiddleware(
  context: BackendContext,
  operation: PublishedClientOperation,
): Promise<void> {
  const result = await fetchJsonResult(context, operationToUrl(operation.name, operation.args));
  operation.resolve(convertJsonPublishedClientResult(operation.name, result));
}

function operationToUrl(operationName: string, args: unknown): RequestInfo {
  return `/api/dossier-published/${operationName}?${encodeObjectToURLSearchParams(
    { args },
    { keepEmptyObjects: true },
  )}`;
}
