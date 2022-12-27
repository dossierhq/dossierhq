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

async function main() {
  while (true) {
    if (await canConnect()) {
      return;
    }
    console.log(
      "Waiting for database connection...",
      process.env.HOST_ROOT_DATABASE_URL ?? process.env.DOCKER_ROOT_DATABASE_URL
    );
    await delay(200);
  }
}

if (require.main === module) {
  main()
    .then(shutDown)
    .catch((error) => {
      console.warn(error);
      process.exitCode = 1;
    });
}
