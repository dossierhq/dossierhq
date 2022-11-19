import { NoOpLogger } from '@jonasb/datadata-core';
import {
  createDatabase,
  createSqlite3Adapter,
} from '@jonasb/datadata-database-adapter-sqlite-sqlite3';
import * as fs from 'node:fs/promises';
import * as Sqlite from 'sqlite3';
import { initializeAndRunTests } from './benchmark.js';

// TODO @types/sqlite is slightly wrong in terms of CommonJS/ESM export
const { Database: SqliteDatabase } = (Sqlite as unknown as { default: typeof Sqlite }).default;

async function createSqliteDatabaseAdapter(databasePath: string) {
  try {
    // delete database to have consistent results
    await fs.unlink(databasePath);
  } catch (error) {
    // ignore
  }

  const context = { logger: NoOpLogger };
  const databaseResult = await createDatabase(context, SqliteDatabase, {
    filename: databasePath,
    journalMode: 'wal',
  });
  if (databaseResult.isError()) return databaseResult;
  const adapterResult = await createSqlite3Adapter(context, databaseResult.value);
  return adapterResult;
}

async function main(runName: string, ciOrLocal: { githubSha: string | undefined } | 'local') {
  const adapter = await createSqliteDatabaseAdapter('output/db-sqlite3.sqlite');
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
  runNameOrCiSwitch === 'ci' ? { githubSha: process.env.GITHUB_SHA } : 'local'
).catch((error) => {
  console.warn(error);
  process.exit(1);
});
