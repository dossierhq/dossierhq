import {
  createBetterSqlite3Adapter,
  type BetterSqlite3DatabaseAdapter,
} from '@dossierhq/better-sqlite3';
import { CLOUDINARY_IMAGE_VALUE_TYPE } from '@dossierhq/cloudinary';
import { FieldType, notOk, ok, type Logger } from '@dossierhq/core';
import { createServer, NoneAndSubjectAuthorizationAdapter, type Server } from '@dossierhq/server';
import BetterSqlite, { type Database } from 'better-sqlite3';
import type { Request } from 'express-jwt';
import type { AppAdminClient, AppPublishedClient } from '../src/SchemaTypes.js';

async function initializeDatabase(logger: Logger) {
  let database: Database;
  try {
    database = new BetterSqlite('data/database.sqlite');
  } catch (error) {
    return notOk.GenericUnexpectedException({ logger }, error);
  }

  return await createBetterSqlite3Adapter({ logger }, database, {
    migrate: true,
    fts: { version: 'fts5' },
    journalMode: 'wal',
  });
}

async function initializeServer(logger: Logger, databaseAdapter: BetterSqlite3DatabaseAdapter) {
  return await createServer({
    databaseAdapter,
    logger,
    authorizationAdapter: NoneAndSubjectAuthorizationAdapter,
  });
}

async function createSessionForRequest(server: Server, req: Request) {
  let provider = 'sys';
  let identifier = 'anonymous';
  if (req.auth && req.auth.sub) {
    provider = 'auth0';
    identifier = req.auth.sub;
  }
  return await server.createSession({ provider, identifier, defaultAuthKeys: ['none', 'subject'] });
}

export function getAdminClientForRequest(server: Server, req: Request) {
  const session = createSessionForRequest(server, req);
  return server.createAdminClient<AppAdminClient>(() => session);
}

export function getPublishedClientForRequest(server: Server, req: Request) {
  const session = createSessionForRequest(server, req);
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
  return schemaResult;
}

async function createMessages(logger: Logger, adminClient: AppAdminClient) {
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

export async function initialize(logger: Logger) {
  const databaseResult = await initializeDatabase(logger);
  if (databaseResult.isError()) return databaseResult;

  const serverResult = await initializeServer(logger, databaseResult.value);
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

  const messageCreateResult = await createMessages(logger, adminClient);
  if (messageCreateResult.isError()) return messageCreateResult;

  return ok({ server });
}
