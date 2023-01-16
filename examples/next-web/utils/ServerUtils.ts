import type { AdminClient, ErrorType, PromiseResult, PublishedClient } from '@dossierhq/core';
import { NoOpLogger, notOk, ok } from '@dossierhq/core';
import { createPostgresAdapter } from '@dossierhq/pg';
import { createDatabase, createSqlite3Adapter } from '@dossierhq/sqlite3';
import type { AuthorizationAdapter, Server } from '@dossierhq/server';
import { createServer, NoneAndSubjectAuthorizationAdapter } from '@dossierhq/server';
import type { NextApiRequest } from 'next';
import { Database } from 'sqlite3';
import { schemaSpecification } from './schema';

let serverConnectionPromise: Promise<{ server: Server }> | null = null;

export async function getSessionContextForRequest(
  server: Server,
  req: NextApiRequest
): PromiseResult<
  { adminClient: AdminClient; publishedClient: PublishedClient },
  typeof ErrorType.NotAuthenticated
> {
  //TODO actually authenticate
  const defaultAuthKeys = getDefaultAuthKeysFromHeaders(req);
  const sessionResult = await server.createSession({
    provider: 'test',
    identifier: 'john-smith',
    defaultAuthKeys,
  });
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

function getDefaultAuthKeysFromHeaders(req: NextApiRequest) {
  const value = req.headers['DataData-Default-Auth-Keys'.toLowerCase()];
  const defaultAuthKeys: string[] = [];
  if (typeof value === 'string') {
    defaultAuthKeys.push(...value.split(',').map((it) => it.trim()));
  } else if (Array.isArray(value)) {
    defaultAuthKeys.push(...value.flatMap((it) => it.split(',')).map((it) => it.trim()));
  }
  return defaultAuthKeys;
}

export async function getServerConnection(): Promise<{ server: Server }> {
  if (!serverConnectionPromise) {
    serverConnectionPromise = (async () => {
      const databaseAdapter = (await createDatabaseAdapter()).valueOrThrow();
      const server = (
        await createServer({
          databaseAdapter,
          authorizationAdapter: createAuthenticationAdapter(),
        })
      ).valueOrThrow();
      const { context } = (
        await server.createSession({
          provider: 'sys',
          identifier: 'schemaloader',
          defaultAuthKeys: [],
        })
      ).valueOrThrow();
      const client = server.createAdminClient(context);
      (await client.updateSchemaSpecification(schemaSpecification)).throwIfError();
      return { server };
    })();
  }

  return serverConnectionPromise;
}

async function createDatabaseAdapter() {
  if (process.env.DATABASE_SQLITE_FILE) {
    const context = { logger: NoOpLogger };
    const databaseResult = await createDatabase(context, Database, {
      filename: process.env.DATABASE_SQLITE_FILE,
    });
    if (databaseResult.isError()) return databaseResult;

    const databaseAdapterResult = await createSqlite3Adapter(context, databaseResult.value, {
      migrate: true,
      fts: { version: 'fts5' },
      journalMode: 'wal',
    });
    return databaseAdapterResult;
  }

  return ok(
    createPostgresAdapter({
      connectionString: process.env.DATABASE_URL!,
    })
  );
}

function createAuthenticationAdapter(): AuthorizationAdapter {
  return NoneAndSubjectAuthorizationAdapter;
}
