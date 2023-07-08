import { NoOpLogger } from '@dossierhq/core';
import { createDatabase, createSqlite3Adapter } from '@dossierhq/sqlite3';
import * as fs from 'node:fs/promises';
import Sqlite from 'sqlite3';
import { initializeAndRunTests } from './benchmark.js';

const { Database } = Sqlite;

async function createSqliteDatabaseAdapter(databasePath: string) {
  try {
    // delete database to have consistent results
    await fs.unlink(databasePath);
  } catch (error) {
    // ignore
  }

  const context = { logger: NoOpLogger };
  const databaseResult = await createDatabase(context, Database, { filename: databasePath });
  if (databaseResult.isError()) return databaseResult;
  const adapterResult = await createSqlite3Adapter(context, databaseResult.value, {
    migrate: true,
    fts: { version: 'fts5' },
    journalMode: 'wal',
  });
  return adapterResult;
}

async function main(runName: string, ciOrLocal: { githubSha: string | undefined } | 'local') {
  const adapter = await createSqliteDatabaseAdapter('databases/db-sqlite3.sqlite');
  const result = await initializeAndRunTests({
    runName,
    variant: 'sqlite',
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
