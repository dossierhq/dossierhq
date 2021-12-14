#!/usr/bin/env node
import Postgrator from 'postgrator';
import pg from 'pg';

const migrationDirectory = new URL('migrations', import.meta.url).pathname;

async function main(connection, targetVersion) {
  const client = new pg.Client({
    connectionString: connection.connectionString,
    ssl: connection.certificateAuthority ? { ca: connection.certificateAuthority } : undefined,
  });

  await client.connect();

  const postgrator = new Postgrator({
    migrationPattern: `${migrationDirectory}/*`,
    driver: 'pg',
    schemaTable: 'schemaversion',
    execQuery: (query) => client.query(query),
  });

  try {
    const appliedMigrations = await postgrator.migrate(targetVersion);
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
  certificateAuthority: process.env.DATABASE_CERTIFICATE_AUTHORITY,
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
