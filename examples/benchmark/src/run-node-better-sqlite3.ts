import { NoOpLogger } from '@jonasb/datadata-core';
import { createBetterSqlite3Adapter } from '@jonasb/datadata-database-adapter-better-sqlite3';
import * as fs from 'node:fs/promises';
import Database from 'better-sqlite3';
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
  return await createBetterSqlite3Adapter(context, database, {
    migrate: true,
    fts: { version: 'fts5' },
    journalMode: 'wal',
  });
}

async function main(runName: string, ciOrLocal: { githubSha: string | undefined } | 'local') {
  const adapter = await createSqliteDatabaseAdapter('output/db-better-sqlite3.sqlite');
  const result = await initializeAndRunTests({
    runName,
    variant: 'node-better-sqlite3',
    databaseAdapter: adapter.valueOrThrow(),
    ciOrLocal,
  });
  result.throwIfError();
}

const runNameOrCiSwitch = process.argv[2] || '';
main(
  runNameOrCiSwitch,
  runNameOrCiSwitch === 'ci' ? { githubSha: process.env.GITHUB_SHA } : 'local'
).catch((error) => {
  console.warn(error);
  process.exit(1);
});
