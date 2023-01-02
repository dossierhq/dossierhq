import type {
  FieldDisplayProps,
  PublishedDataDataContextAdapter,
  RichTextValueItemDisplayProps,
} from '@jonasb/datadata-admin-react-components';
import { PublishedDataDataProvider } from '@jonasb/datadata-admin-react-components';
import { useMemo } from 'react';
import { DISPLAY_AUTH_KEYS } from './AuthConfig.js';
import { usePublishedClient } from './ClientUtils.js';

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
    return null;
  }

  renderPublishedRichTextValueItemDisplay(
    props: RichTextValueItemDisplayProps
  ): JSX.Element | null {
    return null;
  }
}
