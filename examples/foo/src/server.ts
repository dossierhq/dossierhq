import { createBetterSqlite3Adapter } from '@dossierhq/better-sqlite3';
import type { Logger } from '@dossierhq/core';
import { Schema, ok } from '@dossierhq/core';
import type { Server } from '@dossierhq/server';
import { BackgroundEntityProcessorPlugin, createServer } from '@dossierhq/server';
import Database from 'better-sqlite3';
import { schemaSpecification } from './schema.js';

const SQLITE3_DATABASE = 'data/foo.sqlite';

export async function initializeServer(logger: Logger) {
  const database = new Database(SQLITE3_DATABASE);

  const adapterResult = await createBetterSqlite3Adapter({ logger }, database, {
    migrate: true,
    fts: { version: 'fts5' },
    journalMode: 'wal',
  });
  if (adapterResult.isError()) return adapterResult;

  const serverResult = await createServer({ databaseAdapter: adapterResult.value, logger });
  if (serverResult.isError()) return serverResult;
  const server = serverResult.value;

  const processorPlugin = new BackgroundEntityProcessorPlugin(server, logger);
  server.addPlugin(processorPlugin);
  processorPlugin.start();

  return ok(server);
}

export async function updateSchema(server: Server) {
  const sessionResult = server.createSession({
    provider: 'sys',
    identifier: 'schemaloader',
  });

  const adminClient = server.createAdminClient(() => sessionResult);

  const schemaResult = await adminClient.updateSchemaSpecification(schemaSpecification);
  return new Schema(schemaResult.valueOrThrow().schemaSpecification);
}
