#!/usr/bin/env node
import pg from 'pg';
import { migrateDatabaseSchema } from './src/migrate.js';

async function main(connection, targetVersion) {
  const client = new pg.Client({
    connectionString: connection.connectionString,
  });

  await client.connect();

  try {
    const { appliedMigrations } = await migrateDatabaseSchema(
      { execQuery: (query) => client.query(query) },
      targetVersion
    );
    console.log('Applied migrations', appliedMigrations);
  } catch (error) {
    console.error(error);
    console.log(error.appliedMigrations);
    process.exitCode = 1;
  }

  await client.end();
}

const connection = {
  connectionString: process.env.DATABASE_URL,
};
if (!connection.connectionString) {
  throw new Error(`No DATABASE_URL specified`);
}
const args = process.argv.slice(2);
if (args.length > 1) {
  throw new Error(`Expected 0 or 1 arguments, got ${args.length}: ${args}`);
}
const targetVersion = args[0]; // undefined => latest
main(connection, targetVersion).catch((error) => {
  console.warn(error);
  process.exitCode = 1;
});
