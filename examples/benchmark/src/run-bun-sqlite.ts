import { NoOpLogger } from '@jonasb/datadata-core';
import { createBunSqliteAdapter } from '@jonasb/datadata-database-adapter-sqlite-bun';
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
  const adapterResult = await createBunSqliteAdapter(context, database, { journalMode: 'wal' });
  return adapterResult;
}

async function main(runName: string, ciOrLocal: 'ci' | 'local') {
  const adapter = await createSqliteDatabaseAdapter('output/db-bun.sqlite');
  const result = await initializeAndRunTests({
    runName,
    variant: 'bun-sqlite',
    databaseAdapter: adapter.valueOrThrow(),
    ciOrLocal,
  });
  result.throwIfError();
}

const runNameOrCiSwitch = process.argv[2] || '';
main(runNameOrCiSwitch, runNameOrCiSwitch === 'ci' ? 'ci' : 'local').catch((error) => {
  console.warn(error);
  process.exit(1);
});
