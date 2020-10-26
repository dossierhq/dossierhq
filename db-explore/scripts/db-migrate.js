#!/usr/bin/env node
require('dotenv').config();
const Postgrator = require('postgrator');
const urlParse = require('url-parse-lax');
const childProcess = require('child_process');

const migrationDirectory = `${__dirname}/../migrations`;

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

function saveSchema() {
  const schemaFile = `${migrationDirectory}/schema.sql`;
  console.log(`Writing schema to ${schemaFile}`);
  childProcess.execSync(
    `docker-compose -p ${process.env.DOCKER_PROJECT_NAME} exec -T db pg_dump --schema-only --no-owner -d ${process.env.DATABASE_URL} > "${schemaFile}"`
  );
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

    if (process.env.NODE_ENV !== 'production') {
      saveSchema(connectionDetails);
    }
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
