import {
  convertJsonPublishedDossierClientResult,
  createBasePublishedDossierClient,
  createConsoleLogger,
  encodeObjectToURLSearchParams,
  type ClientContext,
  type PublishedDossierClient,
  type PublishedDossierClientOperation,
} from '@dossierhq/core';
import {
  PublishedDossierProvider,
  type FieldDisplayProps,
  type PublishedDossierContextAdapter,
  type RichTextComponentDisplayProps,
} from '@dossierhq/react-components';
import { useMemo } from 'react';
import { fetchJsonResult } from '../utils/fetchJsonResult.js';

type BackendContext = ClientContext;

const logger = createConsoleLogger(console);

class PublishedContextAdapter implements PublishedDossierContextAdapter {
  renderPublishedFieldDisplay(_props: FieldDisplayProps): JSX.Element | null {
    return null;
  }

  renderPublishedRichTextComponentDisplay({
    value: _value,
  }: RichTextComponentDisplayProps): JSX.Element | null {
    return null;
  }
}

export function AppPublishedDossierProvider({ children }: { children: React.ReactNode }) {
  const args = useMemo(
    () => ({
      publishedClient: createBackendPublishedClient(),
      adapter: new PublishedContextAdapter(),
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

function createBackendPublishedClient(): PublishedDossierClient {
  const context: BackendContext = { logger };
  return createBasePublishedDossierClient({ context, pipeline: [terminatingPublishedMiddleware] });
}

async function terminatingPublishedMiddleware(
  context: BackendContext,
  operation: PublishedDossierClientOperation,
): Promise<void> {
  const result = await fetchJsonResult(context, operationToUrl(operation.name, operation.args));
  operation.resolve(convertJsonPublishedDossierClientResult(operation.name, result));
}

function operationToUrl(operationName: string, args: unknown): RequestInfo {
  return `/api/dossier-published/${operationName}?${encodeObjectToURLSearchParams(
    { args },
    { keepEmptyObjects: true },
  )}`;
}
