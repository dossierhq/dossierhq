import type {
  FieldDisplayProps,
  PublishedDataDataContextAdapter,
  RichTextValueItemDisplayProps,
} from '@jonasb/datadata-admin-react-components';
import {
  DisplayAuthKey,
  PublishedDataDataProvider,
  useCachingAdminMiddleware,
} from '@jonasb/datadata-admin-react-components';
import { PublishedClient } from '@jonasb/datadata-core';
import { useMemo } from 'react';
import { createPublishedClient } from './ClientUtils.js';

const DISPLAY_AUTH_KEYS: DisplayAuthKey[] = [
  { authKey: 'none', displayName: 'None' },
  { authKey: 'subject', displayName: 'User private' },
];

interface Props {
  children: React.ReactNode;
}

export function AppPublishedProvider({ children }: Props) {
  const cachingAdminMiddleware = useCachingAdminMiddleware();

  const args = useMemo(
    () => ({
      adapter: new PublishedAdapter(),
      publishedClient: createPublishedClient() as unknown as PublishedClient,
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
