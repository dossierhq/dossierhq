import { createBetterSqlite3Adapter } from '@dossierhq/better-sqlite3';
import { createConsoleLogger, ok } from '@dossierhq/core';
import {
  BackgroundEntityProcessorPlugin,
  NoneAndSubjectAuthorizationAdapter,
  createServer,
  type DatabaseAdapter,
} from '@dossierhq/server';
import Database from 'better-sqlite3';
import assert from 'node:assert/strict';

const logger = createConsoleLogger(console);

export async function initializeServer(filename?: string) {
  const adapterResult = await createDatabaseAdapter(filename);
  if (adapterResult.isError()) return adapterResult;

  return await createBlogServer(adapterResult.value);
}

async function createBlogServer(databaseAdapter: DatabaseAdapter) {
  const serverResult = await createServer({
    databaseAdapter,
    authorizationAdapter: NoneAndSubjectAuthorizationAdapter,
    logger,
  });
  if (serverResult.isError()) return serverResult;
  const server = serverResult.value;

  const plugin = new BackgroundEntityProcessorPlugin(server, logger);
  server.addPlugin(plugin);
  plugin.start();

  return ok({ server });
}

async function createDatabaseAdapter(filename?: string) {
  if (!filename) {
    filename = process.env.DATABASE_SQLITE_FILE;
  }
  assert.ok(filename);
  const database = new Database(filename);
  const databaseAdapterResult = await createBetterSqlite3Adapter({ logger }, database, {
    migrate: true,
    fts: { version: 'fts5' },
    journalMode: 'wal',
  });
  return databaseAdapterResult;
}
