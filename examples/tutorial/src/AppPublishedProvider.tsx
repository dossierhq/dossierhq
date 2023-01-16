import type {
  FieldDisplayProps,
  PublishedDataDataContextAdapter,
  RichTextValueItemDisplayProps,
} from '@jonasb/datadata-admin-react-components';
import { PublishedDataDataProvider } from '@jonasb/datadata-admin-react-components';
import { CloudinaryImageFieldDisplay } from '@jonasb/datadata-cloudinary';
import { isValueItemField } from '@dossierhq/core';
import { useMemo } from 'react';
import { DISPLAY_AUTH_KEYS } from './AuthConfig.js';
import { usePublishedClient } from './ClientUtils.js';
import { CLOUDINARY_CLOUD_NAME } from './CloudinaryConfig.js';
import { isPublishedCloudinaryImage } from './SchemaTypes.js';

interface Props {
  children: React.ReactNode;
}

export function AppPublishedProvider({ children }: Props) {
  const publishedClient = usePublishedClient();
  const args = useMemo(
    () => ({
      adapter: new PublishedAdapter(),
      authKeys: DISPLAY_AUTH_KEYS,
    }),
    []
  );

  if (!publishedClient) return null;

  return (
    <PublishedDataDataProvider {...args} publishedClient={publishedClient}>
      {children}
    </PublishedDataDataProvider>
  );
}

class PublishedAdapter implements PublishedDataDataContextAdapter {
  renderPublishedFieldDisplay(props: FieldDisplayProps): JSX.Element | null {
    const { fieldSpec, value } = props;
    if (isValueItemField(fieldSpec, value) && value && isPublishedCloudinaryImage(value)) {
      return CloudinaryImageFieldDisplay({
        cloudName: CLOUDINARY_CLOUD_NAME,
        value,
      });
    }
    return null;
  }

  renderPublishedRichTextValueItemDisplay({
    value,
  }: RichTextValueItemDisplayProps): JSX.Element | null {
    if (value && isPublishedCloudinaryImage(value)) {
      return CloudinaryImageFieldDisplay({
        cloudName: CLOUDINARY_CLOUD_NAME,
        value,
      });
    }
    return null;
  }
}
