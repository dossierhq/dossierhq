import type {
  AdminClient,
  ErrorType,
  Logger,
  PromiseResult,
  PublishedClient,
} from '@jonasb/datadata-core';
import { notOk, ok, Schema } from '@jonasb/datadata-core';
import { createPostgresAdapter } from '@jonasb/datadata-database-adapter-postgres-pg';
import type { Server } from '@jonasb/datadata-server';
import { createServer } from '@jonasb/datadata-server';
import type { NextApiRequest } from 'next';
import SchemaSpec from './schema.json';

let serverConnectionPromise: Promise<{ server: Server; schema: Schema }> | null = null;

export async function getSessionContextForRequest(
  server: Server,
  req: NextApiRequest
): PromiseResult<
  { adminClient: AdminClient; publishedClient: PublishedClient },
  ErrorType.NotAuthenticated
> {
  //TODO actually authenticate
  const sessionResult = await server.createSession('test', 'john-smith');
  if (sessionResult.isError()) {
    return notOk.NotAuthenticated(
      `Failed authentication: ${sessionResult.error}: ${sessionResult.message}`
    );
  }
  const { context } = sessionResult.value;
  const adminClient = server.createAdminClient(context);
  const publishedClient = server.createPublishedClient(context);
  return ok({ adminClient, publishedClient });
}

export async function getServerConnection(): Promise<{ server: Server; schema: Schema }> {
  if (!serverConnectionPromise) {
    serverConnectionPromise = (async () => {
      const databaseAdapter = createPostgresAdapter(process.env.DATABASE_URL!);
      const serverResult = await createServer({ databaseAdapter });
      if (serverResult.isError()) throw serverResult.toError();
      const server = serverResult.value;

      const schemaLoaderSession = await server.createSession('sys', 'schemaloader');
      if (schemaLoaderSession.isError()) throw schemaLoaderSession.toError();
      const client = server.createAdminClient(schemaLoaderSession.value.context);
      const updateSchemaResult = await client.updateSchemaSpecification(SchemaSpec);
      if (updateSchemaResult.isError()) {
        throw updateSchemaResult.toError();
      }
      return { server, schema: new Schema(updateSchemaResult.value.schemaSpecification) };
    })();
  }

  return serverConnectionPromise;
}
