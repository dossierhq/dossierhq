import type {
  FieldDisplayProps,
  PublishedDataDataContextAdapter,
  RichTextValueItemDisplayProps,
} from '@jonasb/datadata-admin-react-components';
import { PublishedDataDataProvider } from '@jonasb/datadata-admin-react-components';
import { CloudinaryImageFieldDisplay } from '@jonasb/datadata-cloudinary';
import type {
  ClientContext,
  PublishedClient,
  PublishedClientOperation,
} from '@jonasb/datadata-core';
import {
  convertJsonPublishedClientResult,
  createBasePublishedClient,
  createConsoleLogger,
  isValueItemField,
} from '@jonasb/datadata-core';
import { useMemo } from 'react';
import { AUTH_KEYS_HEADER, DISPLAY_AUTH_KEYS } from '../config/AuthKeyConfig';
import { CLOUDINARY_CLOUD_NAME } from '../config/CloudinaryConfig';
import { BackendUrls } from '../utils/BackendUrls';
import { fetchJsonResult } from '../utils/BackendUtils';
import { isPublishedCloudinaryImage } from '../utils/SchemaTypes';

type BackendContext = ClientContext;

const logger = createConsoleLogger(console);

class PublishedContextAdapter implements PublishedDataDataContextAdapter {
  renderPublishedFieldDisplay(props: FieldDisplayProps): JSX.Element | null {
    const { fieldSpec, value } = props;
    if (isValueItemField(fieldSpec, value) && value && isPublishedCloudinaryImage(value)) {
      return CloudinaryImageFieldDisplay({ cloudName: CLOUDINARY_CLOUD_NAME, value });
    }
    return null;
  }

  renderPublishedRichTextValueItemDisplay({
    value,
  }: RichTextValueItemDisplayProps): JSX.Element | null {
    if (value && isPublishedCloudinaryImage(value)) {
      return CloudinaryImageFieldDisplay({ cloudName: CLOUDINARY_CLOUD_NAME, value });
    }
    return null;
  }
}

export function AppPublishedDataDataProvider({ children }: { children: React.ReactNode }) {
  const args = useMemo(
    () => ({
      publishedClient: createBackendPublishedClient(),
      adapter: new PublishedContextAdapter(),
      authKeys: DISPLAY_AUTH_KEYS,
    }),
    []
  );

  const { publishedClient } = args;
  if (!publishedClient) {
    return null;
  }
  return (
    <PublishedDataDataProvider {...args} publishedClient={publishedClient}>
      {children}
    </PublishedDataDataProvider>
  );
}

function createBackendPublishedClient(): PublishedClient {
  const context: BackendContext = { logger };
  return createBasePublishedClient({ context, pipeline: [terminatingPublishedMiddleware] });
}

async function terminatingPublishedMiddleware(
  context: BackendContext,
  operation: PublishedClientOperation
): Promise<void> {
  const result = await fetchJsonResult(
    context,
    BackendUrls.published(operation.name, operation.args),
    { method: 'GET', headers: AUTH_KEYS_HEADER }
  );
  operation.resolve(convertJsonPublishedClientResult(operation.name, result));
}
