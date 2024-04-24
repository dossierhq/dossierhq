#!/usr/bin/env -S npx tsx
import {
  convertJsonSyncEvent,
  getAllNodesForConnection,
  type JsonSyncEvent,
} from '@dossierhq/core';
import type { Server } from '@dossierhq/server';
import { config } from 'dotenv';
import { readFile } from 'node:fs/promises';
import { parseArgs } from 'node:util';
import { SYSTEM_USERS } from '../config/SystemUsers.js';
import { getCurrentSyncEventFiles, updateSyncEventsOnDisk } from '../utils/FileSystemSerializer.js';
import type { AppAdminClient } from '../utils/SchemaTypes';
import { initializeServer } from '../utils/SharedServerUtils.js';

const DATA_DIR = new URL('../data', import.meta.url).pathname;

// prefer .env.local file if exists, over .env file
config({ path: '.env.local' });
config({ path: '.env' });

async function getUnappliedEvents(client: AppAdminClient) {
  // Get file events
  const files = await getCurrentSyncEventFiles(DATA_DIR);
  const diskEventIds = files.map((it) => it.id);

  const databaseEventIds: string[] = [];
  for await (const node of getAllNodesForConnection({ first: 100 }, (paging) =>
    client.getChangelogEvents({}, paging),
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

async function applyDiskEvents(server: Server, unappliedDiskFiles: { path: string }[]) {
  for (const { path } of unappliedDiskFiles) {
    const event: JsonSyncEvent = JSON.parse(await readFile(path, { encoding: 'utf8' }));
    const result = await server.applySyncEvent(convertJsonSyncEvent(event));
    result.throwIfError();
  }

  let processNextDirtyEntity = true;
  while (processNextDirtyEntity) {
    const processed = (await server.processNextDirtyEntity()).valueOrThrow();
    if (!processed) {
      processNextDirtyEntity = false;
    }
  }

  (await server.optimizeDatabase({ all: true })).throwIfError();
}

async function main(filename: string, args: typeof parsedArgs) {
  const { server } = (await initializeServer(filename)).valueOrThrow();
  try {
    const authResult = await server.createSession(SYSTEM_USERS.serverRenderer);
    const client = server.createDossierClient<AppAdminClient>(async () => authResult);

    const { unappliedDiskFiles, unappliedDatabaseEvents } = await getUnappliedEvents(client);

    if (!args.values['update-db-only']) {
      if (unappliedDatabaseEvents.length > 0) {
        console.log(`Write ${unappliedDatabaseEvents.length} missing events to disk`);
        await updateSyncEventsOnDisk(server, DATA_DIR);
      }
    }

    if (unappliedDiskFiles.length > 0) {
      console.log(`Applying ${unappliedDiskFiles.length} disk events`);
      await applyDiskEvents(server, unappliedDiskFiles);
    }
  } finally {
    (await server.shutdown()).throwIfError();
  }
}

const parsedArgs = parseArgs({
  options: { ['update-db-only']: { type: 'boolean' } },
});
await main(process.env.DATABASE_SQLITE_FILE!, parsedArgs);
