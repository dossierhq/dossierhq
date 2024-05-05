import { createBetterSqlite3Adapter } from '@dossierhq/better-sqlite3';
import {
  createConsoleLogger,
  notOk,
  ok,
  type DossierClient,
  type ErrorType,
  type Logger,
  type PromiseResult,
  type PublishedDossierClient,
} from '@dossierhq/core';
import { BackgroundEntityProcessorPlugin, createServer, type Server } from '@dossierhq/server';
import BetterSqlite, { type Database } from 'better-sqlite3';
import type { NextApiRequest } from 'next';
import { schemaSpecification } from './schema';

let serverConnectionPromise: Promise<{ server: Server }> | null = null;
const logger = createConsoleLogger(console);

export async function getSessionContextForRequest(
  server: Server,
  _req: NextApiRequest,
): PromiseResult<
  { client: DossierClient; publishedClient: PublishedDossierClient },
  typeof ErrorType.NotAuthenticated
> {
  //TODO actually authenticate
  const sessionResult = await server.createSession({
    provider: 'test',
    identifier: 'john-smith',
  });
  if (sessionResult.isError()) {
    return notOk.NotAuthenticated(
      `Failed authentication: ${sessionResult.error}: ${sessionResult.message}`,
    );
  }
  const { context } = sessionResult.value;
  const client = server.createDossierClient(context);
  const publishedClient = server.createPublishedDossierClient(context);
  return ok({ client, publishedClient });
}

export async function getServerConnection(): Promise<{ server: Server }> {
  if (!serverConnectionPromise) {
    serverConnectionPromise = (async () => {
      const databaseAdapter = (await createDatabaseAdapter(logger)).valueOrThrow();
      const server = (await createServer({ databaseAdapter })).valueOrThrow();

      const processorPlugin = new BackgroundEntityProcessorPlugin(server, logger);
      server.addPlugin(processorPlugin);
      processorPlugin.start();

      const { context } = (
        await server.createSession({
          provider: 'sys',
          identifier: 'schemaloader',
        })
      ).valueOrThrow();
      const client = server.createDossierClient(context);
      (await client.updateSchemaSpecification(schemaSpecification)).throwIfError();
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
