#!/usr/bin/env node
import Postgrator from 'postgrator';
import urlParse from 'url-parse-lax';

const migrationDirectory = new URL('migrations', import.meta.url).pathname;

function getConnectionDetailsFromUrl() {
  const url = urlParse(process.env.DATABASE_URL);
  const databaseName = url.path.slice(1);
  const [username, password] = url.auth.split(':');
  return {
    host: url.hostname,
    port: url.port,
    database: databaseName,
    username,
    password,
  };
}

async function main(targetVersion) {
  const connectionDetails = getConnectionDetailsFromUrl();
  const postgrator = new Postgrator({
    ...connectionDetails,
    migrationDirectory,
    driver: 'pg',
    schemaTable: 'schemaversion',
    ssl: process.env.NODE_ENV === 'production',
  });

  try {
    const appliedMigrations = await postgrator.migrate(targetVersion);
    console.log('Applied migrations', appliedMigrations);
  } catch (error) {
    console.error(error);
    console.log(error.appliedMigrations);
    process.exitCode = 1;
  }
}

const args = process.argv.slice(2);
if (args.length > 1) {
  throw new Error(`Expected 0 or 1 arguments, got ${args.length}: ${args}`);
}
const targetVersion = args[0]; // undefined => latest
main(targetVersion).catch((error) => {
  console.warn(error);
  process.exitCode = 1;
});
