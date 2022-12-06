#!/usr/bin/env -S npx ts-node -T --esm
import type { AdminSchemaSpecificationUpdate, Logger } from '@jonasb/datadata-core';
import { createConsoleLogger, ok } from '@jonasb/datadata-core';
import { createSqlJsAdapter } from '@jonasb/datadata-database-adapter-sqlite-sql.js';
import type { Server } from '@jonasb/datadata-server';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import * as SqlJs from 'sql.js';
import { SYSTEM_USERS } from '../config/SystemUsers.js';
import { loadAllEntities } from '../utils/FileSystemSerializer.js';
import { createBlogServer } from '../utils/SharedServerUtils.js';

async function initializeServer(logger: Logger) {
  const SQL = await SqlJs.default();
  const db = new SQL.Database();
  const databaseAdapterResult = await createSqlJsAdapter({ logger }, db, {
    migrate: true,
    fts: { version: 'fts4' },
    journalMode: 'memory',
  });
  if (databaseAdapterResult.isError()) return databaseAdapterResult;

  const serverResult = await createBlogServer(databaseAdapterResult.value);
  if (serverResult.isError()) return serverResult;

  return ok({ server: serverResult.value.server, database: db });
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
  polyfillCrypto();
  const logger = createConsoleLogger(console);
  const { server, database } = (await initializeServer(logger)).valueOrThrow();
  try {
    (await updateSchemaSpecification(server, 'data/schema.json')).throwIfError();

    const session = (await server.createSession(SYSTEM_USERS.serverRenderer)).valueOrThrow();
    const adminClient = server.createAdminClient(session.context);
    const entities = await loadAllEntities(adminClient, logger);
    if (entities.isOk()) {
      console.log(`Loaded ${entities.value.length} entities`);
      console.log(`Writing database to ${filename}`);
      fs.writeFileSync(filename, Buffer.from(database.export()));
    } else {
      console.log('Failed loading entities', entities);
    }
  } finally {
    (await server.shutdown()).throwIfError();
  }
}

function polyfillCrypto() {
  // This package is meant to be run in a browser, polyfill crypto for Node
  if (!globalThis.crypto) {
    globalThis.crypto = {
      randomUUID,
    } as Crypto;
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
