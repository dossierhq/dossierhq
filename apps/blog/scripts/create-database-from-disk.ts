#!/usr/bin/env -S bun
import type { Logger } from '@jonasb/datadata-core';
import { createConsoleLogger, ok } from '@jonasb/datadata-core';
import { createBunSqliteAdapter } from '@jonasb/datadata-database-adapter-sqlite-bun';
import { Database } from 'bun:sqlite';
import fs from 'fs/promises';
import { SYSTEM_USERS } from '../config/SystemUsers.js';
import { loadAllEntities } from '../utils/FileSystemSerializer.js';
import { createServerAndInitializeSchema } from '../utils/SharedServerUtils.js';

async function initializeServer(logger: Logger, filename: string) {
  const database = Database.open(filename);
  const databaseAdapterResult = await createBunSqliteAdapter({ logger }, database);
  if (databaseAdapterResult.isError()) return databaseAdapterResult;

  const serverResult = await createServerAndInitializeSchema(databaseAdapterResult.value);
  if (serverResult.isError()) return serverResult;

  return ok(serverResult.value.server);
}

async function main(filename: string) {
  const logger = createConsoleLogger(console);
  const server = (await initializeServer(logger, filename)).valueOrThrow();
  try {
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
  if ((await fs.stat(filename)).isFile()) {
    throw new Error(`File ${filename} already exists`);
  }
} catch (error) {
  const noSuchFile =
    typeof error === 'object' &&
    error &&
    'code' in error &&
    (error as { code: string }).code === 'ENOENT';
  if (!noSuchFile) throw error;
}
await main(filename);
