#!/usr/bin/env -S npx ts-node -T --esm
import type { Logger } from '@dossierhq/core';
import { createConsoleLogger } from '@dossierhq/core';
import { createDatabase, createSqlite3Adapter } from '@dossierhq/sqlite3';
import { config } from 'dotenv';
import Sqlite from 'sqlite3';
import { updateSyncEventsOnDisk } from '../utils/FileSystemSerializer.js';
import { createBlogServer } from '../utils/SharedServerUtils.js';

// prefer .env.local file if exists, over .env file
config({ path: '.env.local' });
config({ path: '.env' });

const { Database: SqliteDatabase } = Sqlite;

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

async function main(filename: string) {
  const logger = createConsoleLogger(console);
  const { server } = (await initializeServer(logger, filename)).valueOrThrow();
  try {
    console.log('Write missing events to disk');
    await updateSyncEventsOnDisk(server);

    // TODO read events from disk and write to database
  } finally {
    (await server.shutdown()).throwIfError();
  }
}

await main(process.env.DATABASE_SQLITE_FILE!);
