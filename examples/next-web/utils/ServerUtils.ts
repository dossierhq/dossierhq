import {
  AdminClient,
  ErrorType,
  Logger,
  notOk,
  ok,
  PromiseResult,
  PublishedClient,
  Schema,
} from '@jonasb/datadata-core';
import { createPostgresAdapter } from '@jonasb/datadata-database-adapter-postgres-pg';
import { createServer, Server2 } from '@jonasb/datadata-server';
import type { NextApiRequest } from 'next';
import SchemaSpec from './schema.json';

let serverConnectionPromise: Promise<{ server: Server2; schema: Schema }> | null = null;

export async function getSessionContextForRequest(
  server: Server2,
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

export async function getServerConnection(): Promise<{ server: Server2; schema: Schema }> {
  if (!serverConnectionPromise) {
    serverConnectionPromise = (async () => {
      const databaseAdapter = createPostgresAdapter(process.env.DATABASE_URL!);
      const noop = () => {};
      const logger: Logger = {
        error: noop,
        warn: noop,
        info: noop,
        debug: noop,
      };
      const serverResult = await createServer({ databaseAdapter, logger });
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
