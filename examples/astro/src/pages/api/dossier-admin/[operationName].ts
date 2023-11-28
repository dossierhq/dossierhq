import { createBetterSqlite3Adapter } from '@dossierhq/better-sqlite3';
import {
  AdminClientModifyingOperations,
  ErrorType,
  createConsoleLogger,
  decodeURLSearchParamsParam,
  executeAdminClientOperationFromJson,
  notOk,
  ok,
  type Logger,
  type Result,
} from '@dossierhq/core';
import {
  NoneAndSubjectAuthorizationAdapter,
  createServer,
  type AuthorizationAdapter,
  type Server,
} from '@dossierhq/server';
import type { APIContext } from 'astro';
import BetterSqlite, { type Database } from 'better-sqlite3';
import { DEFAULT_AUTH_KEYS } from '../../../dossier/config/AuthKeyConfig.ts';

export async function GET({
  params,
  request,
}: APIContext<Record<string, any>, { operationName: string }>) {
  const url = new URL(request.url);
  const urlQuery = new URLSearchParams(url.search);
  const operationArgs = decodeURLSearchParamsParam(urlQuery, 'args');
  return convertResultToResponse(
    await executeAdminOperation('GET', params.operationName, operationArgs),
  );
}

export async function PUT({
  params,
  request,
}: APIContext<Record<string, any>, { operationName: string }>) {
  const body = await request.json();
  return convertResultToResponse(await executeAdminOperation('PUT', params.operationName, body));
}

function convertResultToResponse(result: Result<unknown, ErrorType>) {
  if (result.isOk()) {
    return Response.json(result.value);
  }
  return new Response(result.message, { status: result.httpStatus });
}

async function executeAdminOperation(
  method: 'GET' | 'PUT',
  operationName: string,
  operationArgs: any,
) {
  const operationModifies = AdminClientModifyingOperations.has(operationName);
  if (method === 'GET' && operationModifies) {
    return notOk.BadRequest('Operation modifies data, but GET was used');
  } else if (method === 'PUT' && !operationModifies) {
    return notOk.BadRequest('Operation does not modify data, but PUT was used');
  }

  const adminClientResult = await getAdminClient();
  if (adminClientResult.isError()) return adminClientResult;
  const adminClient = adminClientResult.value;

  const result = await executeAdminClientOperationFromJson(
    adminClient,
    operationName,
    operationArgs,
  );
  return result;
}

async function getAdminClient() {
  const { server } = await getServerConnection();
  const sessionResult = await server.createSession({
    provider: 'test',
    identifier: 'john-smith',
    defaultAuthKeys: DEFAULT_AUTH_KEYS,
    logger,
    databasePerformance: null,
  });
  if (sessionResult.isError()) {
    return sessionResult;
  }
  return ok(server.createAdminClient(sessionResult.value.context));
}

const logger = createConsoleLogger(console);
let serverConnectionPromise: Promise<{ server: Server }> | null = null;
async function getServerConnection(): Promise<{ server: Server }> {
  if (!serverConnectionPromise) {
    serverConnectionPromise = (async () => {
      const databaseAdapter = (await createDatabaseAdapter(logger)).valueOrThrow();
      const server = (
        await createServer({
          databaseAdapter,
          authorizationAdapter: createAuthenticationAdapter(),
        })
      ).valueOrThrow();
      return { server };
    })();
  }

  return serverConnectionPromise;
}

async function createDatabaseAdapter(logger: Logger) {
  const context = { logger };
  let database: Database;
  try {
    database = new BetterSqlite('data/database.sqlite');
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
