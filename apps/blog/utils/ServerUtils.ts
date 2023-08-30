import type { AdminClient, ErrorType, PromiseResult, PublishedClient } from '@dossierhq/core';
import { NoOpLogger, notOk, ok } from '@dossierhq/core';
import type { DatabasePerformanceCallbacks, Server } from '@dossierhq/server';
import { createDatabase, createSqlite3Adapter } from '@dossierhq/sqlite3';
import type { NextApiRequest } from 'next';
import assert from 'node:assert';
import { Database } from 'sqlite3';
import { DEFAULT_AUTH_KEYS } from '../config/AuthKeyConfig';
import { createFilesystemAdminMiddleware } from './FileSystemSerializer';
import { createBlogServer } from './SharedServerUtils';

let serverConnectionPromise: Promise<{ server: Server }> | null = null;

export async function getSessionContextForRequest(
  server: Server,
  _req: NextApiRequest,
  databasePerformance: DatabasePerformanceCallbacks,
): PromiseResult<
  { adminClient: AdminClient; publishedClient: PublishedClient },
  typeof ErrorType.NotAuthenticated
> {
  //TODO actually authenticate
  const sessionResult = await server.createSession({
    provider: 'test',
    identifier: 'john-smith',
    defaultAuthKeys: DEFAULT_AUTH_KEYS,
    logger: null,
    databasePerformance,
  });
  if (sessionResult.isError()) {
    return notOk.NotAuthenticated(
      `Failed authentication: ${sessionResult.error}: ${sessionResult.message}`,
    );
  }
  const { context } = sessionResult.value;
  const adminClient = server.createAdminClient(context, [
    createFilesystemAdminMiddleware(server, server.createAdminClient(context)),
  ]);
  const publishedClient = server.createPublishedClient(context);
  return ok({ adminClient, publishedClient });
}

export async function getServerConnection(): Promise<{ server: Server }> {
  if (!serverConnectionPromise) {
    serverConnectionPromise = (async () => {
      const databaseAdapter = (await createDatabaseAdapter()).valueOrThrow();
      return (await createBlogServer(databaseAdapter)).valueOrThrow();
    })();
  }

  return serverConnectionPromise;
}

async function createDatabaseAdapter() {
  assert.ok(process.env.DATABASE_SQLITE_FILE);
  const context = { logger: NoOpLogger };
  const databaseResult = await createDatabase(context, Database, {
    filename: process.env.DATABASE_SQLITE_FILE,
  });
  if (databaseResult.isError()) return databaseResult;
  const databaseAdapterResult = await createSqlite3Adapter(context, databaseResult.value, {
    migrate: true,
    fts: { version: 'fts4' }, // TODO use fts5 when github actions supports it ("SQL logic error"), match with create-database-from-disk.ts
    journalMode: 'wal',
  });
  return databaseAdapterResult;
}
