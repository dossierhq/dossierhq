import { SYSTEM_USERS } from '../config/SystemUsers';
import type { AppPublishedClient } from './SchemaTypes.js';
import { getServerConnection } from './ServerUtils';

let publishedClientPromise: Promise<AppPublishedClient> | null = null;

export function getPublishedClientForServerComponent(): Promise<AppPublishedClient> {
  if (!publishedClientPromise) {
    publishedClientPromise = (async () => {
      const { server } = await getServerConnection();
      const authResult = await server.createSession(SYSTEM_USERS.serverRenderer);
      return server.createPublishedClient<AppPublishedClient>(authResult.valueOrThrow().context);
    })();
  }
  return publishedClientPromise;
}
