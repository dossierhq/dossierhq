#!/usr/bin/env -S bun
import type { AdminSchemaSpecificationUpdate, Logger } from '@jonasb/datadata-core';
import { createConsoleLogger, ok } from '@jonasb/datadata-core';
import { createBunSqliteAdapter } from '@jonasb/datadata-database-adapter-sqlite-bun';
import type { Server } from '@jonasb/datadata-server';
import { Database } from 'bun:sqlite';
import fs from 'fs';
import { SYSTEM_USERS } from '../config/SystemUsers.js';
import { loadAllEntities } from '../utils/FileSystemSerializer.js';
import { createBlogServer } from '../utils/SharedServerUtils.js';

async function initializeServer(logger: Logger, filename: string) {
  const database = Database.open(filename);
  const databaseAdapterResult = await createBunSqliteAdapter({ logger }, database, {
    migrate: true,
    fts: { version: 'fts5' },
    journalMode: 'wal',
  });
  if (databaseAdapterResult.isError()) return databaseAdapterResult;

  const serverResult = await createBlogServer(databaseAdapterResult.value);
  if (serverResult.isError()) return serverResult;

  return ok(serverResult.value.server);
}

async function updateSchemaSpecification(server: Server, filename: string) {
  const schemaSpecification = JSON.parse(
    fs.readFileSync(filename, { encoding: 'utf8' })
  ) as AdminSchemaSpecificationUpdate;

  const sessionResult = await server.createSession(SYSTEM_USERS.schemaLoader);
  if (sessionResult.isError()) return sessionResult;

  const client = server.createAdminClient(sessionResult.value.context);
  const schemaResult = await client.updateSchemaSpecification(schemaSpecification);
  return schemaResult;
}

async function main(filename: string) {
  const logger = createConsoleLogger(console);
  const server = (await initializeServer(logger, filename)).valueOrThrow();
  try {
    (await updateSchemaSpecification(server, 'data/schema.json')).throwIfError();

    const session = (await server.createSession(SYSTEM_USERS.serverRenderer)).valueOrThrow();
    const adminClient = server.createAdminClient(session.context);
    const entities = await loadAllEntities(adminClient, logger);
    if (entities.isOk()) {
      console.log(`Loaded ${entities.value.length} entities`);
    } else {
      console.log('Failed loading entities', entities);
    }
  } finally {
    (await server.shutdown()).throwIfError();
  }
}

if (process.argv.length !== 3) {
  throw new Error(`Usage: ${process.argv[1]} database/path.sqlite`);
}
const filename = process.argv[2];
try {
  const stat = fs.statSync(filename);
  if (stat?.isFile()) {
    throw new Error(`File ${filename} already exists`);
  }
} catch (error) {
  const noSuchFile =
    typeof error === 'object' && error && (error as { code?: string })['code'] === 'ENOENT';
  if (!noSuchFile) {
    throw error;
  }
}
await main(filename);
