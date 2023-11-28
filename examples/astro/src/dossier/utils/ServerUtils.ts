import { createBetterSqlite3Adapter } from '@dossierhq/better-sqlite3';
import {
  ErrorType,
  createConsoleLogger,
  notOk,
  ok,
  type Logger,
  type PromiseResult,
  type Result,
} from '@dossierhq/core';
import {
  NoneAndSubjectAuthorizationAdapter,
  createServer,
  type AuthorizationAdapter,
  type Server,
  type SessionContext,
} from '@dossierhq/server';
import BetterSqlite, { type Database } from 'better-sqlite3';
import { getPrincipalConfig, type PrincipalConfig } from '../config/PrincipalConfig.ts';

const logger = createConsoleLogger(console);

let serverPromise: Promise<
  Result<Server, typeof ErrorType.BadRequest | typeof ErrorType.Generic>
> | null = null;

export async function getServer(): Promise<
  Result<Server, typeof ErrorType.BadRequest | typeof ErrorType.Generic>
> {
  if (!serverPromise) {
    serverPromise = (async () => {
      const databaseAdapterResult = await createDatabaseAdapter(logger);
      if (databaseAdapterResult.isError()) return databaseAdapterResult;

      return await createServer({
        databaseAdapter: databaseAdapterResult.value,
        authorizationAdapter: createAuthenticationAdapter(),
      });
    })();
  }

  return serverPromise;
}

async function createDatabaseAdapter(logger: Logger) {
  const context = { logger };
  let database: Database;
  try {
    database = new BetterSqlite('database/dossier.sqlite');
  } catch (error) {
    return notOk.GenericUnexpectedException(context, error);
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

export async function getAuthenticatedAdminClient() {
  const principalConfig = getPrincipalConfig(import.meta.env.DOSSIER_PRINCIPAL_ID);
  if (!principalConfig.enableAdmin) {
    return notOk.NotAuthorized('Admin access is disabled for this principal');
  }

  const result = await createSessionForPrincipal(principalConfig);
  if (result.isError()) return result;
  const { server, sessionContext } = result.value;

  return ok(server.createAdminClient(sessionContext));
}

export async function getAuthenticatedPublishedClient() {
  const principalConfig = getPrincipalConfig(import.meta.env.DOSSIER_PRINCIPAL_ID);

  const result = await createSessionForPrincipal(principalConfig);
  if (result.isError()) return result;
  const { server, sessionContext } = result.value;

  return ok(server.createPublishedClient(sessionContext));
}

export async function getAuthenticatedPublishedExceptionClient() {
  const publishedClient = (await getAuthenticatedPublishedClient()).valueOrThrow();
  return publishedClient.toExceptionClient();
}

async function createSessionForPrincipal(
  principalConfig: PrincipalConfig,
): PromiseResult<
  { server: Server; sessionContext: SessionContext },
  typeof ErrorType.BadRequest | typeof ErrorType.Generic
> {
  const serverResult = await getServer();
  if (serverResult.isError()) return serverResult;
  const server = serverResult.value;

  const sessionResult = await server.createSession({
    provider: principalConfig.provider,
    identifier: principalConfig.identifier,
    defaultAuthKeys: principalConfig.defaultAuthKeys,
    logger: null,
    databasePerformance: null,
  });
  if (sessionResult.isError()) return sessionResult;
  const sessionContext = sessionResult.value.context;

  return ok({ server, sessionContext });
}
