import type { AdminClient, ErrorType, PromiseResult, PublishedClient } from '@jonasb/datadata-core';
import { AdminSchema, notOk, ok } from '@jonasb/datadata-core';
import { createPostgresAdapter } from '@jonasb/datadata-database-adapter-postgres-pg';
import type { AuthorizationAdapter, Server } from '@jonasb/datadata-server';
import { createServer } from '@jonasb/datadata-server';
import type { NextApiRequest } from 'next';
import SchemaSpec from './schema.json';

const validKeys: readonly string[] = ['none'];

let serverConnectionPromise: Promise<{ server: Server; schema: AdminSchema }> | null = null;

export async function getSessionContextForRequest(
  server: Server,
  req: NextApiRequest
): PromiseResult<
  { adminClient: AdminClient; publishedClient: PublishedClient },
  ErrorType.NotAuthenticated
> {
  //TODO actually authenticate
  const sessionResult = await server.createSession({ provider: 'test', identifier: 'john-smith' });
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

export async function getServerConnection(): Promise<{ server: Server; schema: AdminSchema }> {
  if (!serverConnectionPromise) {
    serverConnectionPromise = (async () => {
      const databaseAdapter = createPostgresAdapter({
        connectionString: process.env.DATABASE_URL!,
      });
      const serverResult = await createServer({
        databaseAdapter,
        authorizationAdapter: createAuthenticationAdapter(),
      });
      if (serverResult.isError()) throw serverResult.toError();
      const server = serverResult.value;

      const schemaLoaderSession = await server.createSession({
        provider: 'sys',
        identifier: 'schemaloader',
      });
      if (schemaLoaderSession.isError()) throw schemaLoaderSession.toError();
      const client = server.createAdminClient(schemaLoaderSession.value.context);
      const updateSchemaResult = await client.updateSchemaSpecification(SchemaSpec);
      if (updateSchemaResult.isError()) {
        throw updateSchemaResult.toError();
      }
      return { server, schema: new AdminSchema(updateSchemaResult.value.schemaSpecification) };
    })();
  }

  return serverConnectionPromise;
}

function createAuthenticationAdapter(): AuthorizationAdapter {
  return {
    async resolveAuthorizationKeys<T extends string>(authKeys: T[]) {
      const result = {} as Record<T, string>;
      for (const key of authKeys) {
        if (!validKeys.includes(key)) {
          return notOk.BadRequest(`Invalid authorization key ${key}`);
        }
        result[key] = key;
      }
      return ok(result);
    },
  };
}
