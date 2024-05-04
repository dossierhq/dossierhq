import { CloudinaryImageFieldDisplay } from '@dossierhq/cloudinary';
import {
  convertJsonPublishedDossierClientResult,
  createBasePublishedDossierClient,
  createConsoleLogger,
  isComponentItemField,
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
