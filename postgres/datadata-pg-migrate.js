#!/usr/bin/env node
const Postgrator = require('postgrator');
const urlParse = require('url-parse-lax');
const childProcess = require('child_process');

const migrationDirectory = `${__dirname}/migrations`;

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

async function main() {
  const connectionDetails = getConnectionDetailsFromUrl();
  const postgrator = new Postgrator({
    ...connectionDetails,
    migrationDirectory,
    driver: 'pg',
    schemaTable: 'schemaversion',
    ssl: process.env.NODE_ENV === 'production',
  });

  try {
    const target = undefined; // Change if targeting other than latest version
    const appliedMigrations = await postgrator.migrate(target);
    console.log('Applied migrations', appliedMigrations);
  } catch (error) {
    console.error(error);
    console.log(error.appliedMigrations);
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.warn(error);
    process.exitCode = 1;
  });
}
