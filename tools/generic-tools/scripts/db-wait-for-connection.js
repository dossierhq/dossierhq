#!/usr/bin/env node
require("dotenv").config({
  path: require("path").resolve(process.cwd(), ".env"),
});
const { Pool } = require("pg");

const pool = new Pool({
  connectionString:
    process.env.HOST_ROOT_DATABASE_URL ?? process.env.DOCKER_ROOT_DATABASE_URL,
});

function shutDown() {
  return pool.end();
}

async function canConnect() {
  try {
    const { rows } = await pool.query("SELECT TRUE AS online");
    if (rows.length !== 1 || rows[0].online !== true) {
      throw new Error(`Got an unexpected value (${rows})`);
    }
    return true;
  } catch (error) {
    return false;
  }
}

function delay(t) {
  return new Promise((resolve) => setTimeout(resolve, t));
}

// Without a deadline a container that crashes during init (e.g. a broken
// postgis image) makes this loop forever, and CI only fails at the job timeout.
const timeoutSeconds = Number(process.env.DB_WAIT_TIMEOUT_SECONDS ?? 300);

async function main() {
  const deadline = Date.now() + timeoutSeconds * 1000;
  while (Date.now() < deadline) {
    if (await canConnect()) {
      return;
    }
    await delay(200);
  }
  throw new Error(
    `Database not reachable after ${timeoutSeconds}s, check the db container logs`,
  );
}

if (require.main === module) {
  main()
    .then(shutDown)
    .catch((error) => {
      console.warn(error);
      process.exitCode = 1;
    });
}
