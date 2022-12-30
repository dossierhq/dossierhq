import type {
  FieldDisplayProps,
  PublishedDataDataContextAdapter,
  RichTextValueItemDisplayProps,
} from '@jonasb/datadata-admin-react-components';
import {
  PublishedDataDataProvider,
  useCachingAdminMiddleware,
} from '@jonasb/datadata-admin-react-components';
import { useMemo } from 'react';
import { DISPLAY_AUTH_KEYS } from './AuthConfig.js';
import { createPublishedClient } from './ClientUtils.js';

interface Props {
  children: React.ReactNode;
}

export function AppPublishedProvider({ children }: Props) {
  const cachingAdminMiddleware = useCachingAdminMiddleware();

  const args = useMemo(
    () => ({
      adapter: new PublishedAdapter(),
      publishedClient: createPublishedClient(),
      authKeys: DISPLAY_AUTH_KEYS,
    }),
    [cachingAdminMiddleware]
  );

  return <PublishedDataDataProvider {...args}>{children}</PublishedDataDataProvider>;
}

class PublishedAdapter implements PublishedDataDataContextAdapter {
  renderPublishedFieldDisplay(props: FieldDisplayProps): JSX.Element | null {
    return null;
  }

  renderPublishedRichTextValueItemDisplay(
    props: RichTextValueItemDisplayProps
  ): JSX.Element | null {
    return null;
  }
}
