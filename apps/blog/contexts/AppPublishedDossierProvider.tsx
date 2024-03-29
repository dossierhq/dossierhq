import { CloudinaryImageFieldDisplay } from '@dossierhq/cloudinary';
import type { ClientContext, PublishedClient, PublishedClientOperation } from '@dossierhq/core';
import {
  convertJsonPublishedClientResult,
  createBasePublishedClient,
  createConsoleLogger,
  isComponentItemField,
} from '@dossierhq/core';
import type {
  FieldDisplayProps,
  PublishedDossierContextAdapter,
  RichTextComponentDisplayProps,
} from '@dossierhq/react-components';
import { PublishedDossierProvider } from '@dossierhq/react-components';
import { useMemo } from 'react';
import { CLOUDINARY_CLOUD_NAME } from '../config/CloudinaryConfig';
import { BackendUrls } from '../utils/BackendUrls';
import { fetchJsonResult } from '../utils/BackendUtils';
import { isPublishedCloudinaryImage } from '../utils/SchemaTypes';

type BackendContext = ClientContext;

const logger = createConsoleLogger(console);

class PublishedContextAdapter implements PublishedDossierContextAdapter {
  renderPublishedFieldDisplay(props: FieldDisplayProps): JSX.Element | null {
    const { fieldSpec, value } = props;
    if (isComponentItemField(fieldSpec, value) && value && isPublishedCloudinaryImage(value)) {
      return CloudinaryImageFieldDisplay({ cloudName: CLOUDINARY_CLOUD_NAME, value });
    }
    return null;
  }

  renderPublishedRichTextComponentDisplay({
    value,
  }: RichTextComponentDisplayProps): JSX.Element | null {
    if (value && isPublishedCloudinaryImage(value)) {
      return CloudinaryImageFieldDisplay({ cloudName: CLOUDINARY_CLOUD_NAME, value });
    }
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

function createBackendPublishedClient(): PublishedClient {
  const context: BackendContext = { logger };
  return createBasePublishedClient({ context, pipeline: [terminatingPublishedMiddleware] });
}

async function terminatingPublishedMiddleware(
  context: BackendContext,
  operation: PublishedClientOperation,
): Promise<void> {
  const result = await fetchJsonResult(
    context,
    BackendUrls.published(operation.name, operation.args),
  );
  operation.resolve(convertJsonPublishedClientResult(operation.name, result));
}
