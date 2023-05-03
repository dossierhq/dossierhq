#!/usr/bin/env -S npx ts-node -T --esm
import type { AdminSchemaSpecificationUpdate, Logger } from '@dossierhq/core';
import { createConsoleLogger } from '@dossierhq/core';
import type { Server } from '@dossierhq/server';
import { createDatabase, createSqlite3Adapter } from '@dossierhq/sqlite3';
import fs from 'node:fs';
import Sqlite from 'sqlite3';
import { SYSTEM_USERS } from '../config/SystemUsers.js';
import { loadAllEntities } from '../utils/FileSystemSerializer.js';
import { createBlogServer } from '../utils/SharedServerUtils.js';

const { Database: SqliteDatabase } = Sqlite;

const DATA_DIR = new URL('../data', import.meta.url).pathname;

async function initializeServer(logger: Logger, filename: string) {
  const context = { logger };
  const databaseResult = await createDatabase(context, SqliteDatabase, {
    filename,
  });
  if (databaseResult.isError()) return databaseResult;

  const databaseAdapterResult = await createSqlite3Adapter(context, databaseResult.value, {
    migrate: true,
    fts: { version: 'fts4' }, // TODO use fts5 when github actions supports it ("SQL logic error"), match with create-database-from-disk.ts
    journalMode: 'wal',
  });
  if (databaseAdapterResult.isError()) return databaseAdapterResult;

  return await createBlogServer(databaseAdapterResult.value);
}

async function updateSchemaSpecification(server: Server, filename: string) {
  const schemaSpecification = JSON.parse(
    fs.readFileSync(filename, { encoding: 'utf8' })
  ) as AdminSchemaSpecificationUpdate;

  const sessionResult = await server.createSession({
    ...SYSTEM_USERS.schemaLoader,
    logger: null,
    databasePerformance: null,
  });
  if (sessionResult.isError()) return sessionResult;

  const client = server.createAdminClient(sessionResult.value.context);
  const schemaResult = await client.updateSchemaSpecification(schemaSpecification);
  return schemaResult;
}

async function main(filename: string) {
  const logger = createConsoleLogger(console);
  const { server } = (await initializeServer(logger, filename)).valueOrThrow();
  try {
    (await updateSchemaSpecification(server, `${DATA_DIR}/schema.json`)).throwIfError();

    const session = (
      await server.createSession({
        ...SYSTEM_USERS.serverRenderer,
        logger: null,
        databasePerformance: null,
      })
    ).valueOrThrow();
    const adminClient = server.createAdminClient(session.context);
    const entities = await loadAllEntities(adminClient, logger, DATA_DIR);
    if (entities.isOk()) {
      console.log(`Loaded ${entities.value.length} entities`);
      console.log(`Writing database to ${filename}`);
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
