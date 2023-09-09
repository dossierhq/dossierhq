#!/usr/bin/env -S npx ts-node -T --esm
import {
  convertJsonSyncEvent,
  getAllNodesForConnection,
  type JsonSyncEvent,
} from '@dossierhq/core';
import type { Server } from '@dossierhq/server';
import { config } from 'dotenv';
import { readFile } from 'fs/promises';
import { SYSTEM_USERS } from '../config/SystemUsers.js';
import { getCurrentSyncEventFiles, updateSyncEventsOnDisk } from '../utils/FileSystemSerializer.js';
import type { AppAdminClient } from '../utils/SchemaTypes';
import { initializeServer } from '../utils/SharedServerUtils.js';

// prefer .env.local file if exists, over .env file
config({ path: '.env.local' });
config({ path: '.env' });

async function getUnappliedEvents(adminClient: AppAdminClient) {
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
    const event: JsonSyncEvent = JSON.parse(await readFile(path, { encoding: 'utf8' }));
    const result = await server.applySyncEvent(previousEventId, convertJsonSyncEvent(event));
    result.throwIfError();
    previousEventId = event.id;
  }
}

async function main(filename: string) {
  const { server } = (await initializeServer(filename)).valueOrThrow();
  try {
    const authResult = await server.createSession({
      ...SYSTEM_USERS.serverRenderer,
      logger: null,
      databasePerformance: null,
    });
    const adminClient = server.createAdminClient<AppAdminClient>(async () => authResult);

    const { headId, unappliedDiskFiles, unappliedDatabaseEvents } =
      await getUnappliedEvents(adminClient);

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
