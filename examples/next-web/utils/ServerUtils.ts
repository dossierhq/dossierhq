import { createBetterSqlite3Adapter } from '@dossierhq/better-sqlite3';
import type {
  AdminClient,
  ErrorType,
  Logger,
  PromiseResult,
  PublishedClient,
} from '@dossierhq/core';
import { createConsoleLogger, NoOpLogger, notOk, ok } from '@dossierhq/core';
import type { AuthorizationAdapter, Server } from '@dossierhq/server';
import { createServer, NoneAndSubjectAuthorizationAdapter } from '@dossierhq/server';
import BetterSqlite, { type Database } from 'better-sqlite3';
import type { NextApiRequest } from 'next';
import { schemaSpecification } from './schema';

let serverConnectionPromise: Promise<{ server: Server }> | null = null;
const logger = createConsoleLogger(console);

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
  const value = req.headers['Dossier-Default-Auth-Keys'.toLowerCase()];
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
      const databaseAdapter = (await createDatabaseAdapter(logger)).valueOrThrow();
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

async function createDatabaseAdapter(logger: Logger) {
  const context = { logger: NoOpLogger };
  let database: Database;
  try {
    database = new BetterSqlite('data/database.sqlite');
  } catch (error) {
    return notOk.GenericUnexpectedException({ logger }, error);
  }

  const databaseAdapterResult = await createBetterSqlite3Adapter(context, database, {
    migrate: true,
    fts: { version: 'fts5' },
    journalMode: 'wal',
  });
  return databaseAdapterResult;
}

function createAuthenticationAdapter(): AuthorizationAdapter {
  return NoneAndSubjectAuthorizationAdapter;
}
