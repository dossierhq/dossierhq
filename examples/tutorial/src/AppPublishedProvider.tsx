import { CloudinaryImageFieldDisplay } from '@dossierhq/cloudinary';
import { isComponentItemField } from '@dossierhq/core';
import {
  PublishedDossierProvider,
  type FieldDisplayProps,
  type PublishedDossierContextAdapter,
  type RichTextValueItemDisplayProps,
} from '@dossierhq/react-components';
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
    <PublishedDossierProvider {...args} publishedClient={publishedClient}>
      {children}
    </PublishedDossierProvider>
  );
}

class PublishedAdapter implements PublishedDossierContextAdapter {
  renderPublishedFieldDisplay(props: FieldDisplayProps): JSX.Element | null {
    const { fieldSpec, value } = props;
    if (isComponentItemField(fieldSpec, value) && value && isPublishedCloudinaryImage(value)) {
      return CloudinaryImageFieldDisplay({
        cloudName: CLOUDINARY_CLOUD_NAME,
        value,
      });
    }
    return null;
  }

  renderPublishedRichTextComponentDisplay({
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
