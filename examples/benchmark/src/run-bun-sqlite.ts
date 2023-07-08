import { NoOpLogger } from '@dossierhq/core';
import { createBunSqliteAdapter } from '@dossierhq/bun-sqlite';
import { Database } from 'bun:sqlite';
import * as fs from 'node:fs/promises';
import { initializeAndRunTests } from './benchmark.js';

async function createSqliteDatabaseAdapter(databasePath: string) {
  try {
    // delete database to have consistent results
    await fs.unlink(databasePath);
  } catch (error) {
    // ignore
  }

  const context = { logger: NoOpLogger };
  const database = new Database(databasePath);
  const adapterResult = await createBunSqliteAdapter(context, database, {
    migrate: true,
    fts: { version: 'fts5' },
    journalMode: 'wal',
  });
  return adapterResult;
}

async function main(runName: string, ciOrLocal: { githubSha: string | undefined } | 'local') {
  const adapter = await createSqliteDatabaseAdapter('databases/db-bun.sqlite');
  const result = await initializeAndRunTests({
    runName,
    variant: 'bun-sqlite',
    databaseAdapter: adapter.valueOrThrow(),
    ciOrLocal,
  });
  result.throwIfError();
}

const runNameOrCiSwitch = process.argv[2] || '';
main(
  runNameOrCiSwitch,
  runNameOrCiSwitch === 'ci' ? { githubSha: process.env.GITHUB_SHA } : 'local',
).catch((error) => {
  console.warn(error);
  process.exit(1);
});
