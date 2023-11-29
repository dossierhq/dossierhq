import type { Logger } from '@dossierhq/core';
import { AdminSchema, ok } from '@dossierhq/core';
import type { AuthorizationAdapter, Server } from '@dossierhq/server';
import {
  BackgroundEntityProcessorPlugin,
  NoneAndSubjectAuthorizationAdapter,
  createServer,
} from '@dossierhq/server';
import { createBetterSqlite3Adapter } from '@dossierhq/better-sqlite3';
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

  const serverResult = await createServer({
    databaseAdapter: adapterResult.value,
    authorizationAdapter: createAuthorizationAdapter(),
    logger,
  });
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
    defaultAuthKeys: [],
    logger: null,
    databasePerformance: null,
  });

  const adminClient = server.createAdminClient(() => sessionResult);

  const schemaResult = await adminClient.updateSchemaSpecification(schemaSpecification);
  return new AdminSchema(schemaResult.valueOrThrow().schemaSpecification);
}

function createAuthorizationAdapter(): AuthorizationAdapter {
  return NoneAndSubjectAuthorizationAdapter;
}
