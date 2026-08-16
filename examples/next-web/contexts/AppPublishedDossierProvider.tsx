import {
  convertJsonPublishedDossierClientResult,
  createBasePublishedDossierClient,
  createConsoleLogger,
  type ClientContext,
  type PublishedDossierClient,
  type PublishedDossierClientOperation,
} from '@dossierhq/core';
import {
  PublishedDossierProvider,
  type FieldDisplayProps,
  type PublishedDossierContextAdapter,
} from '@dossierhq/react-components2';
import { useMemo, type ReactNode } from 'react';
import { BackendUrls } from '../utils/BackendUrls';
import { fetchJsonResult } from '../utils/BackendUtils';

type BackendContext = ClientContext;

const logger = createConsoleLogger(console);

class PublishedContextAdapter implements PublishedDossierContextAdapter {
  renderPublishedFieldDisplay(_props: FieldDisplayProps): ReactNode | null {
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
  const result = await fetchJsonResult(
    context,
    BackendUrls.published(operation.name, operation.args),
  );
  operation.resolve(convertJsonPublishedDossierClientResult(operation.name, result));
}
