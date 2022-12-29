import {
  AdminDataDataProvider,
  DisplayAuthKey,
  PublishedDataDataProvider,
  useCachingAdminMiddleware,
} from '@jonasb/datadata-admin-react-components';
import { AdminClient, PublishedClient } from '@jonasb/datadata-core';
import { useMemo } from 'react';
import { createAdminClient, createPublishedClient } from './ClientUtils.js';
import { DataDataSharedAdapter } from './DataDataSharedAdapter.js';

const DISPLAY_AUTH_KEYS: DisplayAuthKey[] = [
  { authKey: 'none', displayName: 'None' },
  { authKey: 'subject', displayName: 'User private' },
];

export function DataDataSharedProvider({ children }: { children: React.ReactNode }) {
  const cachingAdminMiddleware = useCachingAdminMiddleware();

  const args = useMemo(() => {
    const adapter = new DataDataSharedAdapter();
    const adminArgs = {
      adminClient: createAdminClient([cachingAdminMiddleware]) as unknown as AdminClient,
      adapter,
      authKeys: DISPLAY_AUTH_KEYS,
    };

    const publishedArgs = {
      adapter,
      publishedClient: createPublishedClient() as unknown as PublishedClient,
      authKeys: DISPLAY_AUTH_KEYS,
    };
    return { adminArgs, publishedArgs };
  }, [cachingAdminMiddleware]);

  return (
    <AdminDataDataProvider {...args.adminArgs}>
      <PublishedDataDataProvider {...args.publishedArgs}>{children}</PublishedDataDataProvider>
    </AdminDataDataProvider>
  );
}
