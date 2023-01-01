import {
  AdminClientJsonOperationArgs,
  AdminClientModifyingOperations,
  AdminSchema,
  createConsoleLogger,
  decodeURLSearchParamsParam,
  ErrorType,
  executeAdminClientOperationFromJson,
  executePublishedClientOperationFromJson,
  FieldType,
  notOk,
  ok,
  PublishedClientJsonOperationArgs,
  Result,
} from '@jonasb/datadata-core';
import {
  BetterSqlite3DatabaseAdapter,
  createBetterSqlite3Adapter,
} from '@jonasb/datadata-database-adapter-better-sqlite3';
import { createServer, NoneAndSubjectAuthorizationAdapter, Server } from '@jonasb/datadata-server';
import { generateTypescriptForSchema } from '@jonasb/datadata-typescript-generator';
import BetterSqlite, { type Database } from 'better-sqlite3';
import bodyParser from 'body-parser';
import express, { RequestHandler, Response } from 'express';
import { writeFile } from 'node:fs/promises';
import type { AppAdminClient, AppPublishedClient } from './src/SchemaTypes.js';

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

async function initializeClients(server: Server) {
  const sessionResult = await server.createSession({
    provider: 'sys',
    identifier: 'anonymous',
    defaultAuthKeys: ['none', 'subject'],
  });
  if (sessionResult.isError()) return sessionResult;
  const { context } = sessionResult.value;

  const adminClient = server.createAdminClient<AppAdminClient>(context);
  const publishedClient = server.createPublishedClient<AppPublishedClient>(context);

  return ok({ adminClient, publishedClient });
}

async function updateSchema(adminClient: AppAdminClient) {
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
  const sourceCode = generateTypescriptForSchema({
    adminSchema,
    publishedSchema,
    authKeyType: "'none' | 'subject'",
  });
  await writeFile('src/SchemaTypes.ts', sourceCode);

  return ok(undefined);
}

async function createMessages(adminClient: AppAdminClient) {
  const totalMessageCountResult = await adminClient.getTotalCount({ entityTypes: ['Message'] });
  if (totalMessageCountResult.isError()) return totalMessageCountResult;

  const desiredMessageCount = 10;
  for (let i = totalMessageCountResult.value; i < desiredMessageCount; i++) {
    const message = `Message ${i}!`;
    const createResult = await adminClient.createEntity(
      {
        info: { type: 'Message', authKey: 'none', name: message },
        fields: { message },
      },
      { publish: true }
    );
    if (createResult.isError()) return createResult;
    const entity = createResult.value.entity;

    logger.info('Created message, id=%s', entity.id);
  }

  return ok(undefined);
}

async function initialize() {
  const databaseResult = await initializeDatabase();
  if (databaseResult.isError()) return databaseResult;

  const serverResult = await initializeServer(databaseResult.value);
  if (serverResult.isError()) return serverResult;
  const server = serverResult.value;

  const clientsResult = await initializeClients(server);
  if (clientsResult.isError()) return clientsResult;
  const { adminClient, publishedClient } = clientsResult.value;

  const schemaResult = await updateSchema(adminClient);
  if (schemaResult.isError()) return schemaResult;

  const messageCreateResult = await createMessages(adminClient);
  if (messageCreateResult.isError()) return messageCreateResult;

  return ok({ server, adminClient, publishedClient });
}

const logger = createConsoleLogger(console);
const { server, adminClient, publishedClient } = (await initialize()).valueOrThrow();

function asyncHandler(handler: (...args: Parameters<RequestHandler>) => Promise<void>) {
  return (...args: Parameters<RequestHandler>) => {
    return handler(...args).catch(args[2]);
  };
}

function sendResult(res: Response, result: Result<unknown, ErrorType>) {
  if (result.isError()) {
    res.status(result.httpStatus).send(result.message);
  } else {
    res.json(result.value);
  }
}

app.use(bodyParser.json());

app.get(
  '/api/message',
  asyncHandler(async (req, res) => {
    const samples = (
      await publishedClient.sampleEntities({ entityTypes: ['Message'] }, { count: 1 })
    ).valueOrThrow();
    const message = samples.items[0];
    res.send({ message: message.fields.message });
  })
);

app.get(
  '/api/admin/:operationName',
  asyncHandler(async (req, res) => {
    const { operationName } = req.params;
    const operationArgs = decodeURLSearchParamsParam<AdminClientJsonOperationArgs>(
      req.query as Record<string, string>,
      'args'
    );
    const operationModifies = AdminClientModifyingOperations.has(operationName);
    if (operationModifies) {
      sendResult(res, notOk.BadRequest('Operation modifies data, but GET was used'));
    } else if (!operationArgs) {
      sendResult(res, notOk.BadRequest('Missing args'));
    } else {
      sendResult(
        res,
        await executeAdminClientOperationFromJson(adminClient, operationName, operationArgs)
      );
    }
  })
);

app.put(
  '/api/admin/:operationName',
  asyncHandler(async (req, res) => {
    const { operationName } = req.params;
    const operationArgs = req.body as AdminClientJsonOperationArgs;
    const operationModifies = AdminClientModifyingOperations.has(operationName);
    if (!operationModifies) {
      sendResult(res, notOk.BadRequest('Operation does not modify data, but PUT was used'));
    } else {
      sendResult(
        res,
        await executeAdminClientOperationFromJson(adminClient, operationName, operationArgs)
      );
    }
  })
);

app.get(
  '/api/published/:operationName',
  asyncHandler(async (req, res) => {
    const { operationName } = req.params;
    const operationArgs = decodeURLSearchParamsParam<PublishedClientJsonOperationArgs>(
      req.query as Record<string, string>,
      'args'
    );
    if (!operationArgs) {
      sendResult(res, notOk.BadRequest('Missing args'));
    } else {
      sendResult(
        res,
        await executePublishedClientOperationFromJson(publishedClient, operationName, operationArgs)
      );
    }
  })
);

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
    logger.info('Backend shut down');
    process.exit(error ? 1 : 0);
  });
}
