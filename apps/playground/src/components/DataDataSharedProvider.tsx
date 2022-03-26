import { DataDataProvider } from '@jonasb/datadata-admin-react-components';
import { useContext, useMemo } from 'react';
import { DISPLAY_AUTH_KEYS } from '../config/AuthConfig';
import { ContextAdapter } from '../config/ContextAdapter';
import { SESSION_LOGGER } from '../config/LoggerConfig';
import { ServerContext } from '../contexts/ServerContext';

export function DataDataSharedProvider({ children }: { children: React.ReactNode }) {
  const { server } = useContext(ServerContext);
  const args = useMemo(() => {
    if (!server) return null;
    return {
      adminClient: server.createAdminClient(() =>
        server.createSession({
          provider: 'sys',
          identifier: 'johndoe',
          defaultAuthKeys: DISPLAY_AUTH_KEYS.map((it) => it.authKey),
          logger: SESSION_LOGGER,
        })
      ),
      adapter: new ContextAdapter(),
      authKeys: DISPLAY_AUTH_KEYS,
    };
  }, [server]);

  if (!args) return null;
  return <DataDataProvider {...args}>{children}</DataDataProvider>;
}
