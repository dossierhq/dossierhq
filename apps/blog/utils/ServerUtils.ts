import type { AdminClient, ErrorType, PromiseResult, PublishedClient } from '@jonasb/datadata-core';
import { NoOpLogger, notOk, ok } from '@jonasb/datadata-core';
import {
  createDatabase,
  createSqlite3Adapter,
} from '@jonasb/datadata-database-adapter-sqlite-sqlite3';
import type { Server } from '@jonasb/datadata-server';
import type { NextApiRequest } from 'next';
import assert from 'node:assert';
import { Database } from 'sqlite3';
import { createFilesystemAdminMiddleware } from './FileSystemSerializer';
import { createBlogServer } from './SharedServerUtils';

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
  const adminClient = server.createAdminClient(context, [
    createFilesystemAdminMiddleware(server.createAdminClient(context)),
  ]);
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
    fts: { version: 'fts5' },
    journalMode: 'wal',
  });
  return databaseAdapterResult;
}
