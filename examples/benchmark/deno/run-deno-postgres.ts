import { ok } from '@dossierhq/core';
import { createPostgresAdapter } from '@dossierhq/deno-postgres';
import { config } from 'dotenv';
import { Pool } from 'postgres';
import { initializeAndRunTests } from '../lib/benchmark.js';

async function createPostgresDatabaseAdapter(connectionString: string) {
  // delete database to have consistent results
  const pool = new Pool(connectionString, 4, true);
  const client = await pool.connect();
  const {
    rows: [{ count }],
  } = await client.queryObject('SELECT COUNT(*) FROM entities');
  if (count > 0) {
    console.log(`Deleting ${count} entities from database`);
    await client.queryArray('DELETE FROM entities');
  }
  await pool.end();

  const databaseAdapter = createPostgresAdapter(connectionString);
  return ok(databaseAdapter);
}

async function main(runName: string, ciOrLocal: { githubSha: string | undefined } | 'local') {
  const adapter = await createPostgresDatabaseAdapter(config().EXAMPLES_BENCHMARK_DATABASE_URL);
  const result = await initializeAndRunTests({
    runName,
    variant: 'deno-postgres',
    databaseAdapter: adapter.valueOrThrow(),
    ciOrLocal,
  });
  result.throwIfError();
}

const runNameOrCiSwitch = Deno.args[0] || '';
await main(
  runNameOrCiSwitch,
  runNameOrCiSwitch === 'ci' ? { githubSha: Deno.env.get('GITHUB_SHA') } : 'local'
).catch((error) => {
  console.warn(error);
  process.exit(1);
});
