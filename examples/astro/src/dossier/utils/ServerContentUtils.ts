import type { AppPublishedDossierClient } from '../../generated/SchemaTypes.ts';
import { getAuthenticatedPublishedClient } from './ServerUtils.ts';

export async function getAuthenticatedPublishedExceptionClient() {
  const publishedClient = (
    await getAuthenticatedPublishedClient()
  ).valueOrThrow() as AppPublishedDossierClient;
  return publishedClient.toExceptionClient();
}
