import { AdminSchema, createConsoleLogger, FieldType, notOk, ok } from '@jonasb/datadata-core';
import {
  BetterSqlite3DatabaseAdapter,
  createBetterSqlite3Adapter,
} from '@jonasb/datadata-database-adapter-better-sqlite3';
import { createServer, NoneAndSubjectAuthorizationAdapter, Server } from '@jonasb/datadata-server';
import { generateTypescriptForSchema } from '@jonasb/datadata-typescript-generator';
import BetterSqlite, { type Database } from 'better-sqlite3';
import express from 'express';
import { writeFile } from 'node:fs/promises';

const app = express();
const port = 3000;

async function initializeDatabase() {
  let database: Database;
  try {
    database = new BetterSqlite('database.sqlite');
  } catch (error) {
    return notOk.GenericUnexpectedException({ logger }, error);
  }

  return await createBetterSqlite3Adapter({ logger }, database, {
    migrate: true,
    fts: { version: 'fts5' },
    journalMode: 'wal',
  });
}

async function initializeServer(databaseAdapter: BetterSqlite3DatabaseAdapter) {
  return await createServer({
    databaseAdapter,
    logger,
    authorizationAdapter: NoneAndSubjectAuthorizationAdapter,
  });
}

async function updateSchema(server: Server) {
  const sessionResult = server.createSession({
    provider: 'sys',
    identifier: 'schemaloader',
    defaultAuthKeys: [],
  });

  const adminClient = server.createAdminClient(() => sessionResult);

  const schemaResult = await adminClient.updateSchemaSpecification({
    entityTypes: [
      {
        name: 'Message',
        fields: [{ name: 'message', type: FieldType.String, required: true, isName: true }],
      },
    ],
  });
  if (schemaResult.isError()) return schemaResult;

  const adminSchema = new AdminSchema(schemaResult.value.schemaSpecification);
  const publishedSchema = adminSchema.toPublishedSchema();
  const sourceCode = generateTypescriptForSchema({ adminSchema, publishedSchema });
  await writeFile('src/SchemaTypes.ts', sourceCode);

  return ok(undefined);
}

async function initialize() {
  const databaseResult = await initializeDatabase();
  if (databaseResult.isError()) return databaseResult;

  const serverResult = await initializeServer(databaseResult.value);
  if (serverResult.isError()) return serverResult;
  const server = serverResult.value;

  const schemaResult = await updateSchema(server);
  if (schemaResult.isError()) return schemaResult;

  return ok(server);
}

const logger = createConsoleLogger(console);
const server = (await initialize()).valueOrThrow();

app.get('/api/hello-world', (req, res) => {
  res.send({ message: 'Hello World!' });
});

const httpServer = app.listen(port, () => {
  console.log(`Listening on http://localhost:${port}`);
});

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

async function shutdown(signal: NodeJS.Signals) {
  logger.info('Received signal %s, shutting down', signal);
  httpServer.closeAllConnections();

  const shutdownResult = await server.shutdown();
  if (shutdownResult.isError()) {
    logger.error(
      'Error while shutting down: %s (%s)',
      shutdownResult.error,
      shutdownResult.message
    );
  }

  httpServer.close((error) => {
    if (error) {
      logger.error('Error while shutting down: %s', error.message);
    }
    logger.info('Server shut down');
    process.exit(error ? 1 : 0);
  });
}
