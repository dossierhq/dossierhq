import 'dotenv/config';
//
import type { ErrorType, PromiseResult } from '@dossierhq/core';
import { assertIsDefined, ok } from '@dossierhq/core';
import type { PgDatabaseAdapter } from '@dossierhq/pg';
import { createPostgresAdapter } from '@dossierhq/pg';
import * as PG from 'pg';
import { initializeAndRunTests } from './benchmark.js';

// TODO @types/pg is slightly wrong in terms of CommonJS/ESM export
const { Client: PGClient } = (PG as unknown as { default: typeof PG }).default;

async function createPostgresDatabaseAdapter(
  connectionString: string
): PromiseResult<PgDatabaseAdapter, typeof ErrorType.Generic> {
  // delete database to have consistent results
  const client = new PGClient({ connectionString });
  await client.connect();
  const {
    rows: [{ count }],
  } = await client.query('SELECT COUNT(*) FROM entities');
  if (count > 0) {
    console.log(`Deleting ${count} entities from database`);
    await client.query('DELETE FROM entities');
  }
  await client.end();

  const databaseAdapter = createPostgresAdapter({ connectionString });
  return ok(databaseAdapter);
}

async function main(runName: string, ciOrLocal: { githubSha: string | undefined } | 'local') {
  assertIsDefined(process.env.EXAMPLES_BENCHMARK_DATABASE_URL);
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
  runNameOrCiSwitch === 'ci' ? { githubSha: process.env.GITHUB_SHA } : 'local'
).catch((error) => {
  console.warn(error);
  process.exit(1);
});
