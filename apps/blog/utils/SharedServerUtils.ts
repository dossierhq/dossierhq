import assert from 'node:assert/strict';
import { createBetterSqlite3Adapter } from '@dossierhq/better-sqlite3';
import { createConsoleLogger, ok } from '@dossierhq/core';
import {
  BackgroundEntityProcessorPlugin,
  createServer,
  type DatabaseAdapter,
} from '@dossierhq/server';
import Database from 'better-sqlite3';

const logger = createConsoleLogger(console);

interface DatabaseOptions {
  filename?: string;
  ftsVersion?: 'fts4' | 'fts5';
}

export async function initializeServer(options: DatabaseOptions = {}) {
  const adapterResult = await createDatabaseAdapter(options);
  if (adapterResult.isError()) return adapterResult;

  return await createBlogServer(adapterResult.value);
}

async function createBlogServer(databaseAdapter: DatabaseAdapter) {
  const serverResult = await createServer({
    databaseAdapter,
    logger,
  });
  if (serverResult.isError()) return serverResult;
  const server = serverResult.value;

  const plugin = new BackgroundEntityProcessorPlugin(server, logger);
  server.addPlugin(plugin);
  plugin.start();

  return ok({ server });
}

async function createDatabaseAdapter(options: DatabaseOptions) {
  const filename = options.filename ?? process.env.DATABASE_SQLITE_FILE;
  assert.ok(filename);
  const database = new Database(filename);
  const databaseAdapterResult = await createBetterSqlite3Adapter({ logger }, database, {
    migrate: true,
    fts: { version: options.ftsVersion ?? 'fts5' },
    journalMode: 'wal',
  });
  return databaseAdapterResult;
}
