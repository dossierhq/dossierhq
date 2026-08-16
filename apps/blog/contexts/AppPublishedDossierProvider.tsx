'use client';

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
} from '@dossierhq/react-components2';
import { useMemo, type ReactNode } from 'react';
import { CLOUDINARY_CLOUD_NAME } from '../config/CloudinaryConfig';
import { BackendUrls } from '../utils/BackendUrls';
import { fetchJsonResult } from '../utils/BackendUtils';
import { isPublishedCloudinaryImage } from '../utils/SchemaTypes';

type BackendContext = ClientContext;

const logger = createConsoleLogger(console);

class PublishedContextAdapter implements PublishedDossierContextAdapter {
  renderPublishedFieldDisplay(props: FieldDisplayProps): ReactNode | null {
    const { fieldSpec, value } = props;
    if (isComponentItemField(fieldSpec, value) && value && isPublishedCloudinaryImage(value)) {
      return <CloudinaryImageFieldDisplay cloudName={CLOUDINARY_CLOUD_NAME} value={value} />;
    }
    return null;
  }

  renderPublishedRichTextComponentDisplay({
    value,
  }: RichTextComponentDisplayProps): ReactNode | null {
    if (value && isPublishedCloudinaryImage(value)) {
      return <CloudinaryImageFieldDisplay cloudName={CLOUDINARY_CLOUD_NAME} value={value} />;
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

  return (
    <PublishedDossierProvider
      publishedClient={args.publishedClient}
      adapter={args.adapter}
      logger={logger}
    >
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
