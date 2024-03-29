import { CloudinaryImageFieldDisplay } from '@dossierhq/cloudinary';
import { isComponentItemField } from '@dossierhq/core';
import {
  PublishedDossierProvider,
  type FieldDisplayProps,
  type PublishedDossierContextAdapter,
  type RichTextComponentDisplayProps,
} from '@dossierhq/react-components';
import { useMemo } from 'react';
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
  }: RichTextComponentDisplayProps): JSX.Element | null {
    if (value && isPublishedCloudinaryImage(value)) {
      return CloudinaryImageFieldDisplay({
        cloudName: CLOUDINARY_CLOUD_NAME,
        value,
      });
    }
    return null;
  }
}
