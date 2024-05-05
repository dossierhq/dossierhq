import { SYSTEM_USERS } from '../config/SystemUsers';
import type { AppPublishedDossierClient } from './SchemaTypes.js';
import { getServerConnection } from './ServerUtils';

let publishedClientPromise: Promise<AppPublishedDossierClient> | null = null;

export function getPublishedClientForServerComponent(): Promise<AppPublishedDossierClient> {
  if (!publishedClientPromise) {
    publishedClientPromise = (async () => {
      const { server } = await getServerConnection();
      const authResult = await server.createSession(SYSTEM_USERS.serverRenderer);
      return server.createPublishedDossierClient<AppPublishedDossierClient>(
        authResult.valueOrThrow().context,
      );
    })();
  }
  return publishedClientPromise;
}
