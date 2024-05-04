import 'dotenv/config';
//
import assert from 'node:assert/strict';
import { ok, type ErrorType, type PromiseResult } from '@dossierhq/core';
import { createPostgresAdapter, type PgDatabaseAdapter } from '@dossierhq/pg';
import PG from 'pg';
import { initializeAndRunTests } from './benchmark.js';

const { Client: PGClient } = PG;

async function createPostgresDatabaseAdapter(
  connectionString: string,
): PromiseResult<PgDatabaseAdapter, typeof ErrorType.Generic> {
  // delete database to have consistent results
  const client = new PGClient({ connectionString });
  await client.connect();
  const {
    rows: [{ count }],
  } = await client.query<{ count: number }>('SELECT COUNT(*) FROM entities');
  if (count > 0) {
    console.log(`Deleting ${count} entities from database`);
    await client.query('DELETE FROM entities');
  }
  await client.end();

  const databaseAdapter = createPostgresAdapter({ connectionString });
  return ok(databaseAdapter);
}

async function main(runName: string, ciOrLocal: { githubSha: string | undefined } | 'local') {
  assert(process.env.EXAMPLES_BENCHMARK_DATABASE_URL);
  const adapter = await createPostgresDatabaseAdapter(process.env.EXAMPLES_BENCHMARK_DATABASE_URL);
  const result = await initializeAndRunTests({
    runName,
    variant: 'postgres',
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
