import { CLOUDINARY_IMAGE_VALUE_TYPE } from '@jonasb/datadata-cloudinary';
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
} from '@dossierhq/core';
import {
  BetterSqlite3DatabaseAdapter,
  createBetterSqlite3Adapter,
} from '@jonasb/datadata-database-adapter-better-sqlite3';
import { createServer, NoneAndSubjectAuthorizationAdapter } from '@jonasb/datadata-server';
import { generateTypescriptForSchema } from '@jonasb/datadata-typescript-generator';
import BetterSqlite, { type Database } from 'better-sqlite3';
import bodyParser from 'body-parser';
import { config } from 'dotenv';
import express, { RequestHandler, Response } from 'express';
import { expressjwt, GetVerificationKey, Request } from 'express-jwt';
import { expressJwtSecret } from 'jwks-rsa';
import { writeFile } from 'node:fs/promises';
import type { AppAdminClient, AppPublishedClient } from './src/SchemaTypes.js';

// prefer .env.local file if exists, over .env file
config({ path: '.env.local' });
config({ path: '.env' });

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

async function createSessionForRequest(req: Request) {
  let provider = 'sys';
  let identifier = 'anonymous';
  if (req.auth && req.auth.sub) {
    provider = 'auth0';
    identifier = req.auth.sub;
  }
  return await server.createSession({ provider, identifier, defaultAuthKeys: ['none', 'subject'] });
}

function getAdminClientForRequest(req: Request) {
  const session = createSessionForRequest(req);
  return server.createAdminClient<AppAdminClient>(() => session);
}

function getPublishedClientForRequest(req: Request) {
  const session = createSessionForRequest(req);
  return server.createPublishedClient<AppPublishedClient>(() => session);
}

async function updateSchema(adminClient: AppAdminClient) {
  const schemaResult = await adminClient.updateSchemaSpecification({
    entityTypes: [
      {
        name: 'Message',
        fields: [
          { name: 'message', type: FieldType.String, required: true, isName: true },
          { name: 'image', type: FieldType.ValueItem, valueTypes: ['CloudinaryImage'] },
        ],
      },
    ],
    valueTypes: [CLOUDINARY_IMAGE_VALUE_TYPE],
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
  const totalMessageCountResult = await adminClient.getTotalCount({
    entityTypes: ['Message'],
    authKeys: ['none'],
  });
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

  const initSession = server.createSession({
    provider: 'sys',
    identifier: 'init',
    defaultAuthKeys: [],
  });
  const adminClient = server.createAdminClient<AppAdminClient>(() => initSession);

  const schemaResult = await updateSchema(adminClient);
  if (schemaResult.isError()) return schemaResult;

  const messageCreateResult = await createMessages(adminClient);
  if (messageCreateResult.isError()) return messageCreateResult;

  return ok({ server });
}

const logger = createConsoleLogger(console);
const { server } = (await initialize()).valueOrThrow();

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
app.use(
  expressjwt({
    secret: expressJwtSecret({
      cache: true,
      rateLimit: true,
      jwksRequestsPerMinute: 5,
      jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`,
    }) as GetVerificationKey,
    audience: process.env.AUTH0_AUDIENCE,
    issuer: `https://${process.env.AUTH0_DOMAIN}/`,
    algorithms: ['RS256'],
    credentialsRequired: false,
  })
);

app.get(
  '/api/message',
  asyncHandler(async (req, res) => {
    const publishedClient = getPublishedClientForRequest(req);
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
    const adminClient = getAdminClientForRequest(req);
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
    const adminClient = getAdminClientForRequest(req);
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
    const publishedClient = getPublishedClientForRequest(req);
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
