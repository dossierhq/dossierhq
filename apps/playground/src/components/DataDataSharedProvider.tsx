import {
  AdminDataDataProvider,
  PublishedDataDataProvider,
} from '@jonasb/datadata-admin-react-components';
import { useContext, useMemo } from 'react';
import { DISPLAY_AUTH_KEYS } from '../config/AuthConfig';
import { ContextAdapter } from '../config/ContextAdapter';
import { SESSION_LOGGER } from '../config/LoggerConfig';
import { ServerContext } from '../contexts/ServerContext';

export function DataDataSharedProvider({ children }: { children: React.ReactNode }) {
  const { server } = useContext(ServerContext);
  const args = useMemo(() => {
    if (!server) return null;

    const sessionResult = server.createSession({
      provider: 'sys',
      identifier: 'johndoe',
      defaultAuthKeys: DISPLAY_AUTH_KEYS.map((it) => it.authKey),
      logger: SESSION_LOGGER,
    });

    const adminArgs = {
      adminClient: server.createAdminClient(() => sessionResult),
      adapter: new ContextAdapter(),
      authKeys: DISPLAY_AUTH_KEYS,
    };

    const publishedArgs = {
      publishedClient: server.createPublishedClient(() => sessionResult),
      authKeys: DISPLAY_AUTH_KEYS,
    };
    return { adminArgs, publishedArgs };
  }, [server]);

  if (!args) return null;
  return (
    <AdminDataDataProvider {...args.adminArgs}>
      <PublishedDataDataProvider {...args.publishedArgs}>{children}</PublishedDataDataProvider>
    </AdminDataDataProvider>
  );
}
