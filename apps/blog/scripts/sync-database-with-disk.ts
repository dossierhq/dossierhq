#!/usr/bin/env -S npx tsx
import {
  assertOkResult,
  convertJsonSyncEvent,
  getAllNodesForConnection,
  type JsonSyncEvent,
} from '@dossierhq/core';
import type { Server } from '@dossierhq/server';
import { config } from 'dotenv';
import assert from 'node:assert';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { SYSTEM_USERS } from '../config/SystemUsers.js';
import { getCurrentSyncEventFiles, updateSyncEventsOnDisk } from '../utils/FileSystemSerializer.js';
import type { AppAdminClient } from '../utils/SchemaTypes';
import { initializeServer } from '../utils/SharedServerUtils.js';

const DATA_DIR = new URL('../data', import.meta.url).pathname;
const PRINCIPALS_HEADER: [string, string, string] = ['provider', 'identifier', 'subjectId'];

// prefer .env.local file if exists, over .env file
config({ path: '.env.local' });
config({ path: '.env' });

async function getUnappliedEvents(adminClient: AppAdminClient) {
  // Get file events
  const files = await getCurrentSyncEventFiles(DATA_DIR);
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

export async function updatePrincipalsOnDisk(server: Server, filename: string): Promise<void> {
  const rows: (typeof PRINCIPALS_HEADER)[] = [];
  rows.push(PRINCIPALS_HEADER);

  const contentRows: typeof rows = [];
  for await (const principal of getAllNodesForConnection({ first: 100 }, (paging) =>
    server.getPrincipals(paging),
  )) {
    const { provider, identifier, subjectId } = principal.valueOrThrow();
    contentRows.push([provider, identifier, subjectId]);
  }

  contentRows.sort((a, b) => {
    const providerCompare = a[0].localeCompare(b[0]);
    if (providerCompare !== 0) {
      return providerCompare;
    }
    return a[1].localeCompare(b[1]);
  });
  rows.push(...contentRows);

  const content = rows.map((row) => row.join('\t')).join('\n') + '\n';

  await writeFile(filename, content, { encoding: 'utf8' });
}

export async function createPrincipalsFromDisk(server: Server, filename: string): Promise<void> {
  const content = await readFile(filename, { encoding: 'utf8' });
  const rows = content
    .split('\n')
    .filter((it) => it.length > 0)
    .map((it) => it.split('\t')) as (typeof PRINCIPALS_HEADER)[];

  const header = rows[0];
  assert.deepEqual(header, PRINCIPALS_HEADER);

  const contentRows = rows.slice(1);
  for (const [provider, identifier, subjectId] of contentRows) {
    assertOkResult(await server.createPrincipal({ provider, identifier, subjectId }));
  }
}

async function main(filename: string, args: typeof parsedArgs) {
  const { server } = (await initializeServer(filename)).valueOrThrow();
  try {
    const principalsFilename = path.join(DATA_DIR, 'principals.tsv');
    await createPrincipalsFromDisk(server, principalsFilename);
    if (!args.values['update-db-only']) {
      await updatePrincipalsOnDisk(server, principalsFilename);
    }

    const authResult = await server.createSession({
      ...SYSTEM_USERS.serverRenderer,
      logger: null,
      databasePerformance: null,
    });
    const adminClient = server.createAdminClient<AppAdminClient>(async () => authResult);

    const { unappliedDiskFiles, unappliedDatabaseEvents } = await getUnappliedEvents(adminClient);

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
