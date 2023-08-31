#!/usr/bin/env -S npx ts-node -T --esm
import type { Logger, SyncEvent } from '@dossierhq/core';
import { createConsoleLogger, getAllNodesForConnection, ok } from '@dossierhq/core';
import type { Server } from '@dossierhq/server';
import { createDatabase, createSqlite3Adapter } from '@dossierhq/sqlite3';
import { config } from 'dotenv';
import { readFile } from 'fs/promises';
import Sqlite from 'sqlite3';
import { SYSTEM_USERS } from '../config/SystemUsers.js';
import { getCurrentSyncEventFiles, updateSyncEventsOnDisk } from '../utils/FileSystemSerializer.js';
import type { AppAdminClient } from '../utils/SchemaTypes';
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

async function getUnappliedEvents(server: Server, adminClient: AppAdminClient) {
  // Get file events
  const files = await getCurrentSyncEventFiles();
  const diskEventIds = files.map((it) => it.id);

  const databaseEventIds: string[] = [];
  for await (const node of getAllNodesForConnection({ first: 100 }, (paging) =>
    adminClient.getChangelogEvents({}, paging),
  )) {
    databaseEventIds.push(node.valueOrThrow().id);
  }

  const minSize = Math.min(diskEventIds.length, databaseEventIds.length);

  // check that the events match pairwise
  for (let i = 0; i < minSize; i++) {
    if (diskEventIds[i] !== databaseEventIds[i]) {
      throw new Error(
        `Mismatch between disk and database events at index ${i}: ${diskEventIds[i]} !== ${databaseEventIds[i]}`,
      );
    }
  }

  const headId = minSize > 0 ? diskEventIds[minSize - 1] : null;
  const unappliedDiskFiles = files.slice(minSize);
  const unappliedDatabaseEvents = databaseEventIds.slice(minSize);
  return { headId, unappliedDiskFiles, unappliedDatabaseEvents };
}

async function applyDiskEvents(
  server: Server,
  headId: string | null,
  unappliedDiskFiles: { path: string }[],
) {
  let previousEventId = headId;
  for (const { path } of unappliedDiskFiles) {
    const event: SyncEvent = JSON.parse(await readFile(path, { encoding: 'utf8' }));
    const result = await server.applySyncEvent(previousEventId, event);
    result.throwIfError();
    previousEventId = event.id;
  }
}

async function main(filename: string) {
  const logger = createConsoleLogger(console);
  const { server } = (await initializeServer(logger, filename)).valueOrThrow();
  try {
    const authResult = await server.createSession({
      ...SYSTEM_USERS.serverRenderer,
      logger: null,
      databasePerformance: null,
    });
    const adminClient = server.createAdminClient<AppAdminClient>(async () => authResult);

    const { headId, unappliedDiskFiles, unappliedDatabaseEvents } = await getUnappliedEvents(
      server,
      adminClient,
    );

    if (unappliedDatabaseEvents.length > 0) {
      console.log(`Write ${unappliedDatabaseEvents.length} missing events to disk`);
      await updateSyncEventsOnDisk(server);
    }

    if (unappliedDiskFiles.length > 0) {
      console.log(`Applying ${unappliedDiskFiles.length} disk events`);
      await applyDiskEvents(server, headId, unappliedDiskFiles);
    }
  } finally {
    (await server.shutdown()).throwIfError();
  }
}

await main(process.env.DATABASE_SQLITE_FILE!);
